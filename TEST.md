# Testing Guide

Advanced Player Studio uses **Playwright** to run comprehensive End-to-End (E2E) tests. Because our application relies heavily on browser-native APIs (like `AudioContext`, `VTTCue`, and SVG `<feComponentTransfer>`), running real browser tests is the only way to guarantee stability.

## Running the Tests

To run the full suite of automated tests, simply use:
```bash
npm test
```

This will launch a headless Chromium browser, load the local `index.html` file, inject our test media from `tests/artifacts/`, and emulate user interactions like hotkeys, mouse panning, and subtitle file uploads.

## Viewing the HTML Report

Every time you run the tests, an HTML report is automatically generated (even on success). To view it, run:
```bash
npx playwright show-report
```
The report includes execution timelines and high-resolution screenshots of the exact UI state at the end of every test.

## Visual Regression Testing (Snapshots)

Our tests compare the actual UI against "golden" snapshots located in the `screenshots/` directory. 

### Why is there a 5% tolerance?
You might notice `{ maxDiffPixelRatio: 0.05 }` in `tests/log.spec.ts`. The Action Log includes real-time timestamps (e.g., `[14:08:12]`). A strict pixel-by-pixel comparison would fail on every run as time progresses. We allow a 5% margin to ignore the timestamp changes while still catching actual layout breakages.

### Updating Snapshots

If you intentionally alter the UI layout, add new CSS, or introduce a new feature, the tests will fail due to visual mismatch.
To update the golden snapshots with your new UI, run:
```bash
npm run test:update
```
Always review the changed `.png` files in `screenshots/` before committing to ensure the new layout looks correct.
