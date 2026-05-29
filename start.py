#!/usr/bin/env python3
"""Cross-platform SyncTalk dev runner. Starts Postgres, backend, frontend.

  - Postgres : localhost:5434 (docker container 'synctalk_db')
  - Backend  : http://localhost:5001
  - Frontend : http://localhost:4000

Logs stream to console with [backend]/[frontend] prefixes and are also
mirrored to .logs/{backend,frontend}.log. Ctrl-C cleanly stops both.
"""

import os
import shutil
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
LOG_DIR = ROOT / ".logs"
IS_WINDOWS = os.name == "nt"

GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
NC = "\033[0m"


def info(msg):
    print(f"{GREEN}[start]{NC} {msg}", flush=True)


def warn(msg):
    print(f"{YELLOW}[start]{NC} {msg}", flush=True)


def fail(msg):
    print(f"{RED}[start]{NC} {msg}", file=sys.stderr, flush=True)
    sys.exit(1)


def find_venv_python():
    for c in (
        BACKEND / "venv" / "bin" / "python",
        BACKEND / "venv" / "Scripts" / "python.exe",
        BACKEND / "venv" / "Scripts" / "python",
    ):
        if c.exists():
            try:
                r = subprocess.run([str(c), "--version"],
                                   capture_output=True, timeout=10, text=True)
                if r.returncode == 0:
                    return c
            except (subprocess.TimeoutExpired, OSError):
                continue
    return None


def ensure_postgres():
    if not shutil.which("docker"):
        fail("docker is required (https://docs.docker.com/get-docker/)")

    info("Ensuring Postgres container 'synctalk_db' is up...")
    running = subprocess.run(
        ["docker", "ps", "--format", "{{.Names}}"],
        cwd=str(ROOT), capture_output=True, text=True,
    ).stdout
    if "synctalk_db" not in running.split():
        subprocess.run(["docker", "compose", "up", "-d", "db"],
                       cwd=str(ROOT), check=True)

    info("Waiting for Postgres to accept connections...")
    for _ in range(30):
        r = subprocess.run(
            ["docker", "exec", "synctalk_db", "pg_isready", "-U", "postgres"],
            capture_output=True,
        )
        if r.returncode == 0:
            info("Postgres is ready.")
            return
        time.sleep(1)
    fail("Postgres did not become ready in 30s.")


def apply_migrations(venv_py):
    info("Applying any pending DB migrations...")
    log = LOG_DIR / "backend.log"
    with open(log, "a", encoding="utf-8") as f:
        r = subprocess.run(
            [str(venv_py), "-m", "flask", "db", "upgrade"],
            cwd=str(BACKEND),
            stdout=f, stderr=subprocess.STDOUT,
            env={**os.environ, "FLASK_APP": "run.py", "PYTHONIOENCODING": "utf-8"},
        )
    if r.returncode != 0:
        warn(f"flask db upgrade returned non-zero (check {log})")


def stream(name, proc, log_path, color):
    """Pipe `proc.stdout` to console (prefixed) and append to a log file."""
    with open(log_path, "a", encoding="utf-8", buffering=1) as f:
        for raw_line in iter(proc.stdout.readline, ""):
            line = raw_line.rstrip("\r\n")
            if not line:
                continue
            print(f"{color}[{name}]{NC} {line}", flush=True)
            f.write(raw_line)
            f.flush()


# Track child processes for the signal handler.
_processes = []
_shutting_down = False


def shutdown(signum=None, frame=None):
    global _shutting_down
    if _shutting_down:
        return
    _shutting_down = True
    print()
    info("Shutting down...")
    for p in _processes:
        if p.poll() is None:
            try:
                if IS_WINDOWS:
                    # Send CTRL_BREAK to the whole group; npm/Next don't
                    # honour SIGTERM cleanly on Windows.
                    p.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    p.terminate()
            except (OSError, ValueError):
                pass
    deadline = time.time() + 5
    for p in _processes:
        remaining = max(0, deadline - time.time())
        try:
            p.wait(timeout=remaining)
        except subprocess.TimeoutExpired:
            p.kill()
    info("Stopped. (Postgres container left running — use 'docker compose stop db' to stop it.)")
    sys.exit(0)


def spawn(cmd, cwd, log_path, env=None):
    extra_kwargs = {}
    if IS_WINDOWS:
        # Make the child its own process group so we can deliver CTRL_BREAK
        # to it without killing this script too.
        extra_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        extra_kwargs["start_new_session"] = True
    return subprocess.Popen(
        cmd,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
        text=True,
        env={**os.environ, **(env or {})},
        **extra_kwargs,
    )


def main():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    if not (BACKEND / "venv").exists():
        fail("Backend venv not found. Run 'python setup.py' first.")
    venv_py = find_venv_python()
    if not venv_py:
        fail("venv exists but has no usable python interpreter. "
             "It was likely created on another machine. "
             "Fix: delete backend/venv and run 'python setup.py'.")
    info(f"Using venv interpreter: {venv_py}")

    ensure_postgres()
    apply_migrations(venv_py)

    info("Starting Flask backend on http://localhost:5001 ...")
    backend_log = LOG_DIR / "backend.log"
    backend_proc = spawn(
        [str(venv_py), "run.py"],
        cwd=BACKEND,
        log_path=backend_log,
        env={"PYTHONIOENCODING": "utf-8", "PYTHONUNBUFFERED": "1"},
    )
    _processes.append(backend_proc)
    threading.Thread(
        target=stream,
        args=("backend", backend_proc, backend_log, GREEN),
        daemon=True,
    ).start()

    info("Starting Next.js frontend on http://localhost:4000 ...")
    frontend_log = LOG_DIR / "frontend.log"
    npm = "npm.cmd" if IS_WINDOWS else "npm"
    frontend_proc = spawn(
        [npm, "run", "dev"],
        cwd=FRONTEND,
        log_path=frontend_log,
    )
    _processes.append(frontend_proc)
    threading.Thread(
        target=stream,
        args=("frontend", frontend_proc, frontend_log, "\033[0;36m"),
        daemon=True,
    ).start()

    signal.signal(signal.SIGINT, shutdown)
    if not IS_WINDOWS:
        signal.signal(signal.SIGTERM, shutdown)

    print(f"""
{GREEN}SyncTalk is running.{NC}
  - Backend  : http://localhost:5001   (logs: {backend_log})
  - Frontend : http://localhost:4000   (logs: {frontend_log})
  - Postgres : localhost:5434          (docker container 'synctalk_db')

Press Ctrl-C to stop both services.
""", flush=True)

    try:
        while True:
            for p in _processes:
                if p.poll() is not None:
                    warn(f"Process exited (code {p.returncode}). Stopping the rest.")
                    shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
