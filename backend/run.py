# backend/run.py

import eventlet
eventlet.monkey_patch()

import os
import sys

# Force UTF-8 on stdout/stderr so seed.py's Unicode arrows (→, ✓, ✗) render
# instead of crashing under Windows' default cp1252 codec. Has to happen
# before any print() that touches non-ASCII.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        # Older Python or non-text stream — give up silently; ASCII still works.
        pass

from dotenv import load_dotenv
from app import create_app, socketio

load_dotenv()

app = create_app()


@app.route('/api/synctalk-status', methods=['GET'])
def status():
    return {'status': 'ok'}


def auto_seed_if_empty():
    """Populate demo data on first startup, skip on subsequent boots.

    Idempotent by design: the check is "are there any users?" — once the
    database has been seeded (or has real signups), this returns immediately.

    Set SKIP_AUTO_SEED=1 in the environment to disable entirely (useful for
    production deployments where demo data would be undesirable).
    """
    if os.environ.get('SKIP_AUTO_SEED', '').lower() in ('1', 'true', 'yes'):
        return

    with app.app_context():
        try:
            from app.models import User
            existing = User.query.count()
        except Exception as e:
            # Almost certainly "table doesn't exist" — caller should run
            # `flask db upgrade` first. Don't kill the server over it; the
            # operator will see this in the log.
            print(
                f'[auto-seed] Could not query users table ({e}). '
                'Run `flask db upgrade` then restart.',
                file=sys.stderr,
            )
            return

        if existing > 0:
            print(
                f'[auto-seed] Skipping — {existing} user(s) already present.'
            )
            return

    print('[auto-seed] Database is empty — running seed.py...')
    try:
        from seed import main as run_seed
        run_seed(app)
        print('[auto-seed] Demo data seeded.')
    except Exception as e:
        # Seeding failure is recoverable — the server can still serve an
        # empty DB. Surface the error but don't refuse to start.
        print(f'[auto-seed] Seeding failed: {e}', file=sys.stderr)


# Run at import time so it fires under both `python run.py` and any WSGI
# server that imports `app` from this module.
auto_seed_if_empty()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=False)
