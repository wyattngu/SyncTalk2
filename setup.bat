@echo off
rem Thin wrapper that probes for a working Python 3.8+ and runs setup.py.
rem All real logic lives in setup.py for cross-platform support.

setlocal
set DIR=%~dp0

for %%P in (python py python3) do (
  where %%P >nul 2>nul && %%P -c "import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)" >nul 2>nul && (
    %%P "%DIR%setup.py" %*
    exit /b %errorlevel%
  )
)

echo ERROR: No working Python 3.8+ found. 1>&2
echo Install from https://www.python.org/ then re-run this script. 1>&2
echo Also disable App execution aliases for python.exe/python3.exe in Settings. 1>&2
exit /b 1
