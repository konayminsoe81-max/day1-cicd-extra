"""Build Pipeline Test: Verifies that site packaging completes properly."""
import json
import subprocess
import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = ROOT / "scripts" / "build_site.py"
DIST_DIR = ROOT / "dist"


class TestBuildPipeline(unittest.TestCase):
    def test_build_script_execution(self):
        result = subprocess.run(
            [sys.executable, str(BUILD_SCRIPT)],
            capture_output=True,
            text=True
        )
        self.assertEqual(result.returncode, 0, f"Build script failed:\n{result.stderr}")
        self.assertTrue(DIST_DIR.exists(), "dist/ directory was not created")
        self.assertTrue((DIST_DIR / "index.html").exists(), "dist/index.html is missing")
        self.assertTrue((DIST_DIR / "game.js").exists(), "dist/game.js is missing")
        self.assertTrue((DIST_DIR / "build-info.json").exists(), "dist/build-info.json is missing")

        with open(DIST_DIR / "build-info.json", "r", encoding="utf-8") as f:
            info = json.load(f)
            self.assertIn("commit", info)
            self.assertIn("run", info)


if __name__ == "__main__":
    unittest.main()
