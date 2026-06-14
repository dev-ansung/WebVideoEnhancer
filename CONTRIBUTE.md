# Contributing to Advanced Player Studio

First off, thank you for considering contributing to Advanced Player Studio! It's people like you that make it such a great tool.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/WebVideoEnhancer.git
   cd WebVideoEnhancer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *Note: This will automatically install TypeScript, esbuild, and provision the Playwright Chromium binaries via a postinstall script.*

## Project Architecture

The project has been refactored into a modern, SOLID-compliant TypeScript architecture:
- `src/core/`: Contains the main `PlayerStudio` orchestrator.
- `src/managers/`: Contains single-responsibility controllers (e.g., `VideoController`, `SubtitleEngine`, `FilterController`).
- `src/ui/`: Contains the functional UI components used to render the player.
- `dist/`: Contains the compiled, production-ready `studio.js` file. **Do not edit files in `dist/` directly.**

## Development Workflow

1. Make your changes inside the `src/` directory.
2. Compile your changes:
   ```bash
   npm run build
   ```
3. Test your changes locally by opening `index.html` in your browser.

## Testing Your Changes

Before submitting a Pull Request, you must ensure that all End-to-End tests pass.
Please refer to our comprehensive [TEST.md](TEST.md) for detailed instructions on running the test suite and updating visual snapshots.

## Submitting a Pull Request

1. Create a new branch for your feature (`git checkout -b feature/amazing-feature`).
2. Commit your changes (`git commit -m 'Add some amazing feature'`).
3. Push to the branch (`git push origin feature/amazing-feature`).
4. Open a Pull Request on GitHub.
