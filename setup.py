#!/usr/bin/env python3
"""Cross-platform SyncTalk setup. Runs on Linux, macOS, Windows.

Performs:
  1. System tool checks (python, node, docker)
  2. Backend virtualenv (recreate if broken / from another machine)
  3. Backend pip install
  4. .env files from defaults if missing
  5. Frontend npm install
  6. Postgres docker container
  7. flask db upgrade

Usage:
    python setup.py              # full setup
    python setup.py --seed       # full setup + run seed.py
    python setup.py --reset      # destroy & recreate the postgres volume
"""

import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
IS_WINDOWS = os.name == "nt"

GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
BLUE = "\033[0;34m"
NC = "\033[0m"


def section(msg):
    print(f"\n{BLUE}━━━ {msg} ━━━{NC}", flush=True)


def info(msg):
    print(f"{GREEN}[ok]{NC} {msg}", flush=True)


def warn(msg):
    print(f"{YELLOW}[warn]{NC} {msg}", flush=True)


def fail(msg):
    print(f"{RED}[err]{NC} {msg}", file=sys.stderr, flush=True)
    sys.exit(1)


def run(cmd, cwd=None, check=True, env=None, capture=False, **kwargs):
    """Run a subprocess with sane defaults and UTF-8 piping."""
    full_env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
    if env:
        full_env.update(env)
    return subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        check=check,
        env=full_env,
        text=True,
        capture_output=capture,
        **kwargs,
    )


def have(cmd):
    return shutil.which(cmd) is not None


def find_python_3():
    """Return the path to a working Python 3.8+ interpreter (skip MS Store stubs)."""
    for candidate in ("python3", "python", "py"):
        path = shutil.which(candidate)
        if not path:
            continue
        try:
            r = subprocess.run(
                [path, "-c", "import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)"],
                capture_output=True, text=True, timeout=10,
            )
            if r.returncode == 0:
                return path
        except (subprocess.TimeoutExpired, OSError):
            continue
    return None


def find_venv_python():
    """Find a working python.exe in backend/venv. None if missing/broken."""
    candidates = [
        BACKEND / "venv" / "bin" / "python",
        BACKEND / "venv" / "Scripts" / "python.exe",
        BACKEND / "venv" / "Scripts" / "python",
    ]
    for c in candidates:
        if c.exists():
            try:
                r = subprocess.run([str(c), "--version"], capture_output=True, text=True, timeout=10)
                if r.returncode == 0:
                    return c
            except (subprocess.TimeoutExpired, OSError):
                continue
    return None


def parse_args():
    p = argparse.ArgumentParser(description="SyncTalk setup")
    p.add_argument("--seed", action="store_true", help="run seed.py after setup")
    p.add_argument("--reset", action="store_true",
                   help="destroy + recreate the postgres volume + reseed")
    return p.parse_args()


def check_tools():
    section("Checking system tools")

    py = find_python_3()
    if not py:
        fail("Python 3.8+ is required. Install from https://www.python.org/. "
             "On Windows, also disable App execution aliases for python.exe/python3.exe in Settings.")
    version = run([py, "--version"], capture=True).stdout.strip()
    info(f"Python: {version} ({py})")

    if not have("node"):
        fail("node is required (>=20)")
    info(f"Node: {run(['node', '--version'], capture=True).stdout.strip()}")

    if not have("npm"):
        fail("npm is required")
    npm_cmd = "npm.cmd" if IS_WINDOWS else "npm"
    info(f"npm: {run([npm_cmd, '--version'], capture=True).stdout.strip()}")

    if not have("docker"):
        fail("docker is required (https://docs.docker.com/get-docker/)")
    try:
        run(["docker", "info"], capture=True, timeout=10)
    except subprocess.CalledProcessError:
        fail("docker daemon is not running. Start it first.")
    info("Docker: ready")

    try:
        run(["docker", "compose", "version"], capture=True, timeout=10)
    except subprocess.CalledProcessError:
        fail("docker compose v2 is required (the 'docker compose' subcommand)")

    return py


def setup_venv(host_python):
    section("Setting up backend Python environment")

    venv_dir = BACKEND / "venv"

    if venv_dir.exists():
        existing = find_venv_python()
        if not existing:
            warn("Existing venv is broken (likely created on another machine). Removing and rebuilding...")
            shutil.rmtree(venv_dir)

    if not venv_dir.exists():
        info(f"Creating virtualenv at {venv_dir}")
        run([host_python, "-m", "venv", str(venv_dir)])
    else:
        info("Reusing existing venv")

    venv_py = find_venv_python()
    if not venv_py:
        fail("Failed to create a working venv. Try deleting backend/venv and re-running.")

    info("Installing Python dependencies (1-2 min on first run)...")
    run([str(venv_py), "-m", "pip", "install", "--upgrade", "pip", "--quiet"])
    run([str(venv_py), "-m", "pip", "install", "-r", str(BACKEND / "requirements.txt"), "--quiet"])
    run([str(venv_py), "-m", "pip", "install", "openpyxl", "--quiet"])
    info("Backend dependencies installed")

    return venv_py


BACKEND_ENV_TEMPLATE = """\
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=synctalk_super_secret_key_change_in_production
JWT_SECRET_KEY=synctalk_jwt_secret_key_change_in_production
JWT_ACCESS_TOKEN_EXPIRES=3600

DB_HOST=localhost
DB_PORT=5434
DB_NAME=SyncTalk
DB_USER=postgres
DB_PASSWORD=1

# Get a free Gemini key at https://aistudio.google.com/apikey
GEMINI_API_KEY=

# Cloudinary (optional, only for image uploads) — https://cloudinary.com
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
"""

FRONTEND_ENV_TEMPLATE = """\
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
"""


def setup_env_files():
    section("Configuring environment files")

    backend_env = BACKEND / ".env"
    if not backend_env.exists():
        backend_env.write_text(BACKEND_ENV_TEMPLATE, encoding="utf-8")
        info(f"Created {backend_env}")
        warn("→ Paste your GEMINI_API_KEY into backend/.env to enable AI features")
    else:
        info("Reusing existing backend/.env")

    frontend_env = FRONTEND / ".env.local"
    if not frontend_env.exists():
        frontend_env.write_text(FRONTEND_ENV_TEMPLATE, encoding="utf-8")
        info(f"Created {frontend_env}")
    else:
        info("Reusing existing frontend/.env.local")


def setup_frontend(reset):
    section("Setting up frontend Node modules")

    node_modules = FRONTEND / "node_modules"
    if not node_modules.exists() or reset:
        info("Running npm install (this can take a couple of minutes)...")
        npm = "npm.cmd" if IS_WINDOWS else "npm"
        run([npm, "install"], cwd=FRONTEND)
    else:
        info("node_modules present — running npm install to sync any changes...")
        npm = "npm.cmd" if IS_WINDOWS else "npm"
        run([npm, "install", "--silent"], cwd=FRONTEND)
    info("Frontend dependencies installed")


def setup_postgres(reset):
    section("Starting Postgres (Docker container 'synctalk_db' on port 5434)")

    if reset:
        warn("Reset requested — removing existing 'synctalk_db' container + volume")
        run(["docker", "compose", "down", "-v", "--remove-orphans"], cwd=ROOT, check=False)

    running = run(["docker", "ps", "--format", "{{.Names}}"], cwd=ROOT, capture=True).stdout
    if "synctalk_db" in running.split():
        info("Container 'synctalk_db' already running")
    else:
        run(["docker", "compose", "up", "-d", "db"], cwd=ROOT)
        info("Container started")

    info("Waiting for Postgres to accept connections...")
    for i in range(30):
        r = run(["docker", "exec", "synctalk_db", "pg_isready", "-U", "postgres"],
                check=False, capture=True)
        if r.returncode == 0:
            info("Postgres is ready")
            return
        time.sleep(1)
    fail("Postgres did not become ready in 30s. Check 'docker logs synctalk_db'.")


def apply_migrations(venv_py):
    section("Applying database migrations")

    migrations_dir = BACKEND / "migrations"
    flask_env = {
        "FLASK_APP": "run.py",
        "PYTHONIOENCODING": "utf-8",
    }
    if not migrations_dir.exists():
        info("First run — initialising Flask-Migrate")
        run([str(venv_py), "-m", "flask", "db", "init"], cwd=BACKEND, check=False, env=flask_env)
        run([str(venv_py), "-m", "flask", "db", "migrate", "-m", "initial schema"],
            cwd=BACKEND, check=False, env=flask_env)
    run([str(venv_py), "-m", "flask", "db", "upgrade"], cwd=BACKEND, env=flask_env)
    info("Schema is up to date")


def run_seed(venv_py):
    section("Seeding demo data")
    run([str(venv_py), "seed.py"], cwd=BACKEND, env={"PYTHONIOENCODING": "utf-8"})


def print_done(seed_ran):
    section("Setup complete")
    print(f"""
{GREEN}You're all set.{NC}

Next steps:
  1. (Optional) Edit {BLUE}backend/.env{NC} and paste GEMINI_API_KEY
     to unlock AI summary + semantic search + the SyncBot chatbot.
  2. Run {BLUE}python start.py{NC} (or {BLUE}./start.sh{NC} / {BLUE}start.bat{NC})
     to launch backend + frontend.
  3. Visit {BLUE}http://localhost:4000{NC}

The first time the backend boots into an empty database it will seed
demo data automatically. On subsequent boots the check sees existing
users and skips.

  Force a re-seed anytime: {BLUE}python -m backend.seed{NC} (or run seed.py)
  Disable auto-seed:       set {BLUE}SKIP_AUTO_SEED=1{NC} in the env
  Wipe + reseed:           {BLUE}python setup.py --reset{NC}
""")


def main():
    args = parse_args()

    if args.reset:
        # --reset implies --seed (DB will be empty after volume wipe)
        args.seed = True

    host_python = check_tools()
    venv_py = setup_venv(host_python)
    setup_env_files()
    setup_frontend(args.reset)
    setup_postgres(args.reset)
    apply_migrations(venv_py)
    if args.seed:
        run_seed(venv_py)

    print_done(args.seed)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        warn("Interrupted")
        sys.exit(130)
    except subprocess.CalledProcessError as e:
        fail(f"Command failed: {' '.join(map(str, e.cmd))} (exit {e.returncode})")
