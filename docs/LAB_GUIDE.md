# 🚀 Hands-on Lab: GitHub Actions CI/CD Pipeline & GitHub Pages

Welcome to the **Cyber Arcade: Neon Defender** CI/CD hands-on tutorial. In this exercise, you will experience the complete **GitHub Flow** lifecycle:
1. Setting up automated testing and continuous deployment.
2. Intentionally introducing a breaking change to trigger a pipeline failure.
3. Observing how the automated quality gate halts deployment and protects production.
4. Applying a fix and witnessing self-healing automated deployment to **GitHub Pages**.

---

## 🛠️ Step 0: Test Locally First

Before pushing to remote, verify the project locally:

```bash
cd /Users/Shared/dev/day1-cicd-extra

# 1. Run the test suite
python3 -m unittest discover -s tests -v

# 2. Test the build script
python3 scripts/build_site.py

# 3. Optional: Play the game locally in your browser
python3 -m http.server 8080 --directory site
# Then open http://localhost:8080 in your browser!
```

---

## 🌐 Step 1: Enable GitHub Pages in your Repository

For GitHub Actions to deploy your site, enable Actions as the GitHub Pages source:

1. Open your repository on GitHub:
   👉 **`https://github.com/konayminsoe81-max/day1-cicd-extra`**
2. Click **Settings** (top navigation tab).
3. On the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment** → **Source**, select:
   👉 **`GitHub Actions`** (instead of "Deploy from a branch").
5. Save your settings.

---

## 💥 Step 2: Simulate an Intentional Pipeline Failure

Now, let's test how GitHub Actions acts as a **Quality Gate** when bad code is pushed.

In `site/game-config.json`, the quality gate requires `system_status` to be `"Operational"`. Let's intentionally set it to `"Degraded"`:

### 1. Introduce the breaking change:
```bash
cd /Users/Shared/dev/day1-cicd-extra

# Modify status to Degraded (macOS syntax)
sed -i '' 's/"system_status": "Operational"/"system_status": "Degraded"/' site/game-config.json
```

### 2. Verify the change locally:
```bash
git diff site/game-config.json
```

### 3. Run the tests locally to see what happens:
```bash
python3 -m unittest discover -s tests -v
```
You will see:
```text
FAIL: test_system_status_operational (test_game_config.TestGameConfig.test_system_status_operational)
AssertionError: 'Degraded' != 'Operational'
- Degraded
+ Operational
: Release blocked: system_status must be 'Operational' before deploy (found: 'Degraded')
```

### 4. Commit and push the failure to GitHub:
```bash
git add site/game-config.json
git commit -m "feat: simulate degraded status to test CI pipeline"
git push origin main
```

---

## 🔍 Step 3: Inspect the Failure in GitHub Actions

1. Go to the **Actions** tab on your repository:
   👉 **`https://github.com/konayminsoe81-max/day1-cicd-extra/actions`**
2. Notice the top workflow run marked with a **Red X (Failed)** ❌.
3. Click on the run name (`feat: simulate degraded status...`).
4. Click on the **Run CI Quality Gate Tests & Build Game** job.
5. Expand the **Run CI Quality Gate Tests** step to view the exact error log!
6. Notice that the **Deploy to GitHub Pages** job **never ran**!
   > 🛡️ **Key Takeaway:** The broken code was blocked from reaching your live players.

---

## 🩹 Step 4: Fix the Issue & Release `v1.1.0`

Now, let's fix the status, bump the version to `v1.1.0`, and watch the pipeline automatically recover and deploy!

### 1. Apply the fix:
```bash
# Restore status to Operational
sed -i '' 's/"system_status": "Degraded"/"system_status": "Operational"/' site/game-config.json

# Bump version to v1.1.0
sed -i '' 's/"version": "v1.0.0"/"version": "v1.1.0"/' site/game-config.json
```

### 2. Verify your tests pass:
```bash
python3 -m unittest discover -s tests -v
```
Output:
```text
Ran 7 tests in 0.05s
OK
```

### 3. Commit and push the fix:
```bash
git add site/game-config.json
git commit -m "fix: restore operational status and release v1.1.0"
git push origin main
```

---

## 🏆 Step 5: Verify the Live Deployment!

1. Return to the **Actions** tab:
   👉 **`https://github.com/konayminsoe81-max/day1-cicd-extra/actions`**
2. Watch the workflow execute:
   - ✅ **Test & Build** turns green!
   - 🚀 **Deploy to GitHub Pages** triggers automatically!
3. Click into the **Deploy to GitHub Pages** step to get your live URL, or visit:
   👉 **`https://konayminsoe81-max.github.io/day1-cicd-extra/`**
4. Play your live retro **Cyber Arcade** game directly on GitHub Pages! Notice the updated version (`v1.1.0`) and live build number in the header!
