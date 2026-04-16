#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import os
import sys
from pathlib import Path


def main():
    try:
        input_data = json.loads(sys.stdin.read())

        project_root = Path(__file__).resolve().parent.parent.parent
        log_dir = project_root / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "notification.jsonl"

        with open(log_path, "a") as f:
            f.write(json.dumps(input_data) + "\n")

        sys.exit(0)

    except Exception:
        sys.exit(0)


if __name__ == "__main__":
    main()
