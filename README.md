# 🕹️ Cyber Arcade: Neon Defender (CI/CD GitHub Actions Demo)

A retro-futuristic HTML5 canvas arcade game built to demonstrate **modern CI/CD pipelines with GitHub Actions** and **GitHub Pages deployment**.

---

## 🌟 Features
- **Pure JavaScript & HTML5 Canvas**: 60fps arcade shooter with dynamic particle explosions and starry space parallax.
- **Synthesized Web Audio API**: Laser, explosion, and hit sound effects with zero external audio assets.
- **Responsive Controls**: Full support for desktop keyboard (`WASD` / arrow keys + `Space`) and mobile touch controls.
- **CRT Filter**: Toggleable retro scanline effect.
- **GitHub Flow CI/CD**:
  - Quality gates: Automated SemVer validation, config sanity, and web contracts.
  - Zero-touch deployment to **GitHub Pages** via official GitHub actions.
  - Injected build metadata (commit SHA, run number, timestamp).

---

## 🚀 Live Demo on GitHub Pages
Visit your live game at:
👉 **[https://konayminsoe81-max.github.io/day1-cicd-extra/](https://konayminsoe81-max.github.io/day1-cicd-extra/)**

*(Ensure **GitHub Actions** is selected as the Pages build source under Repository Settings → Pages).*

---

## 🧪 Local Testing & Development

```bash
# Run unit tests locally
python3 -m unittest discover -s tests -v

# Build the static site into dist/
python3 scripts/build_site.py

# Play locally in your web browser
python3 -m http.server 8080 --directory site
# Then visit http://localhost:8080
```

---

## 📖 Hands-on CI/CD Lab Guide
Want to test introducing a breaking change to see GitHub Actions block deployment, and then fix it to see it deploy live?

👉 Check out the full walkthrough: **[docs/LAB_GUIDE.md](docs/LAB_GUIDE.md)**!
