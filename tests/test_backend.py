import subprocess
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
PYTHON = ROOT_DIR / "backend" / "venv" / "bin" / "python"


def test_backend_unit_tests_pass():
    result = subprocess.run(
        [str(PYTHON), "manage.py", "test"],
        cwd=BACKEND_DIR,
        check=False,
        text=True,
        capture_output=True,
    )

    assert result.returncode == 0, result.stdout + result.stderr
