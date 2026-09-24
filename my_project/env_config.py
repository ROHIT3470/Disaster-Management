"""Load local project environment files for the Python tools.

Shell environment variables always win. The loader intentionally supports only
simple KEY=VALUE entries and never prints secret values.
"""

from pathlib import Path
import os


PROJECT_DIR = Path(__file__).resolve().parent
ENV_FILES = (
    PROJECT_DIR / ".env",
    PROJECT_DIR.parent / "backend" / ".env",
)


def _parse_value(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def load_project_environment() -> Path | None:
    """Load the first available local env file without overriding shell vars."""
    for env_file in ENV_FILES:
        if not env_file.is_file():
            continue

        for raw_line in env_file.read_text(encoding="utf-8-sig").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            if key and key not in os.environ:
                os.environ[key] = _parse_value(value)

        return env_file

    return None


load_project_environment()
