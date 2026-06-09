import subprocess
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT_DIR / "frontend"


def test_frontend_unit_tests_pass():
    result = subprocess.run(
        ["npm", "run", "test"],
        cwd=FRONTEND_DIR,
        check=False,
        text=True,
        capture_output=True,
    )

    assert result.returncode == 0, result.stdout + result.stderr
