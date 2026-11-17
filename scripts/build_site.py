"""Build script for Cyber Arcade: bundles and injects metadata into dist/."""
import json
import os
import shutil
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "site"
target = ROOT / "dist"

if target.exists():
    shutil.rmtree(target)

shutil.copytree(source, target)

# Inject dynamic build metadata
build_meta = {
    "commit": os.getenv("GITHUB_SHA", "local-dev")[:7],
    "run": os.getenv("GITHUB_RUN_NUMBER", "dev"),
    "build_time": datetime.now(timezone.utc).isoformat(),
    "pipeline": "github-actions"
}

(target / "build-info.json").write_text(
    json.dumps(build_meta, indent=2) + "\n",
    encoding="utf-8"
)

print(f"✅ Build completed successfully: {target}")
print(f"📦 Files packaged: {', '.join(sorted(p.name for p in target.iterdir()))}")
