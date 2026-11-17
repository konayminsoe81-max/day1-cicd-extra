"""CI/CD Quality Gate: Validates game configuration rules."""
import json
import re
from pathlib import Path
import unittest

CONFIG_FILE = Path(__file__).resolve().parents[1] / "site" / "game-config.json"


class TestGameConfig(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.assertTrue(CONFIG_FILE.exists(), f"Missing config file: {CONFIG_FILE}")
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cls.config = json.load(f)

    def test_version_format_semver(self):
        """Quality Gate: Version must follow SemVer format 'vMAJOR.MINOR.PATCH'."""
        version = self.config.get("version", "")
        self.assertTrue(
            re.match(r"^v\d+\.\d+\.\d+$", version),
            f"Release blocked: version '{version}' does not match SemVer format 'vMAJOR.MINOR.PATCH' (e.g., v1.0.0)"
        )

    def test_system_status_operational(self):
        """Quality Gate: Release blocked unless system status is 'Operational'."""
        status = self.config.get("system_status", "")
        self.assertEqual(
            status,
            "Operational",
            f"Release blocked: system_status must be 'Operational' before deploy (found: '{status}')"
        )

    def test_initial_lives_valid_range(self):
        """Game Balance Gate: Initial lives must be an integer between 1 and 5."""
        lives = self.config.get("initial_lives")
        self.assertIsInstance(lives, int, "initial_lives must be an integer")
        self.assertGreaterEqual(lives, 1, f"initial_lives cannot be less than 1 (found: {lives})")
        self.assertLessEqual(lives, 5, f"initial_lives cannot exceed 5 (found: {lives})")

    def test_difficulty_allowed_values(self):
        """Validates difficulty setting is an allowed tier."""
        difficulty = self.config.get("difficulty")
        allowed = ["easy", "medium", "hard"]
        self.assertIn(
            difficulty,
            allowed,
            f"Invalid difficulty '{difficulty}'. Allowed: {allowed}"
        )


if __name__ == "__main__":
    unittest.main()
