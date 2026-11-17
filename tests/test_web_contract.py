"""Web Contract Test: Verifies essential DOM elements and asset links."""
from pathlib import Path
import unittest

INDEX_HTML = (Path(__file__).resolve().parents[1] / "site" / "index.html").read_text(encoding="utf-8")


class TestWebContract(unittest.TestCase):
    def test_doctype_and_title(self):
        self.assertIn("<!DOCTYPE html>", INDEX_HTML)
        self.assertIn("<title>Cyber Arcade: Neon Defender</title>", INDEX_HTML)

    def test_canvas_element_present(self):
        self.assertIn('id="game-canvas"', INDEX_HTML)

    def test_essential_hud_ids_present(self):
        required_ids = [
            'id="hud-score"',
            'id="hud-lives"',
            'id="hud-wave"',
            'id="release-version"',
            'id="system-status"'
        ]
        for req in required_ids:
            self.assertIn(req, INDEX_HTML, f"Missing required element: {req}")

    def test_relative_asset_paths(self):
        """GitHub Pages requires relative asset paths to work properly under subpaths."""
        self.assertIn('href="./style.css"', INDEX_HTML)
        self.assertIn('src="./game.js"', INDEX_HTML)


if __name__ == "__main__":
    unittest.main()
