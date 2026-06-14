# Advanced Player Studio (Web Video Enhancer)

### Elevating standard web video players into a professional-grade media review and language learning workspace.

Advanced Player Studio is a client-side media dashboard that wraps HTML5 video elements in a professional control console. It is available both as an offline-capable local web app and a browser extension UserScript. 

Recently completely refactored into a modern, SOLID-compliant TypeScript architecture, this project delivers high-performance, precision controls designed for accessibility, language learning, and visual examination.

## 📸 Product Interface Showcases

| Immersive Bilingual Engine |
|:---:|
| <img src="screenshots/showcase-bilingual.gif" width="800" /> |
| *Side-by-side Dual Transcripts synchronized with hardware-accelerated on-video captions.* |

| Real-time Spatial Filtering |
|:---:|
| <img src="screenshots/showcase-filters.gif" width="800" /> |
| *GPU-accelerated Gamma, Tint, and Contrast applied directly to the video element.* |

| Advanced Telemetry & Precision Analytics |
|:---:|
| <img src="screenshots/showcase-zoom-telemetry.gif" width="800" /> |
| *Mouse-driven spatial pan matrices, audio frequency visualization, and global event logs.* |

| Real-time Subtitle Synchronization |
|:---:|
| <img src="screenshots/showcase-sync.gif" width="800" /> |
| *Instantly adjust subtitle rendering delays using hotkeys, tracked by high-precision visual telemetry.* |

---

## 🚀 Quick Start & Usage

There are two primary ways to use Advanced Player Studio:

### 🌐 Option A: Instant Web App (No Installation)
You can use the studio immediately, right in your browser. Since the application processes everything locally, your files never leave your computer.

1. Go to: **[https://dev-ansung.github.io/WebVideoEnhancer/](https://dev-ansung.github.io/WebVideoEnhancer/)** (or open `index.html` locally).
2. Click **Load MP4 Video** to select a video file from your computer.
3. Use the **Load .srt 1** and **Load .srt 2** upload areas to attach bilingual subtitles.
4. Enjoy advanced playback controls!

### 🐒 Option B: UserScript Hijacker (Use it Across the Web)
Want these advanced controls on your favorite streaming sites? The UserScript hijacks native HTML5 video players and wraps them in the Advanced Player Studio.

1. Install a UserScript manager extension (such as **Tampermonkey** or **Violentmonkey**).
2. Install the script by importing `dist/userscript.js` or pasting its contents into a new script.
3. Navigate to a website with a standard video player.
4. Click **Universal Web Video Enhancer** in the Tampermonkey popup menu and click **✅ Enable on [current site]**.
5. Click **🔍 Scan Now** in the floating scanner panel, then click **▶ Hijack Node to Studio** to instantly upgrade the video player.

---

## ✨ Features

- **Dual Bilingual Subtitle Tracks**: Parse and play two independent `.srt` subtitle files simultaneously.
- **Dynamic Timing Drift Correction**: Adjust subtitle synchronization offset in ±100ms intervals with instant HUD feedback (Perfect for correcting out-of-sync caption files).
- **Interactive Dual Transcripts**: Side-by-side scrolling transcripts with click-to-seek phrase navigation, search filtering, and smart scroll suspension.
- **GPU-Accelerated Color Grading**: Hardware-accelerated **Gamma Correction** (via custom SVG feComponentTransfer filters), alongside precise adjustments for **Contrast, Brightness, Saturation, Hue Rotation, and Color Tint overlays** (supporting Multiply, Screen, Overlay, and Color blending modes with 0–100% intensity).
- **Subtitle Layout Tweaker**: Customize font size, color, and vertical position independently for each subtitle track.
- **Web Audio Frequency Visualizer**: Interactive canvas-based frequency-domain visualizer powered by the Web Audio API (`AudioContext` and `AnalyserNode`).
- **Interactive Spatial Zoom & Pan**: Mouse-wheel scaling (up to 5x) and middle-click-and-drag viewport panning with real-time telemetry metrics.
- **Auto-Chapters Partitioning**: Automatically divides video duration into tenths for fast navigation.
- **HUD Diagnostics & Event Log**: Live telemetry dashboard tracking Zoom scale, Pan offsets, Sync shift, volume, rate, and an on-screen console logging system events.

---

## 🏗 Architecture & Key Implementation Insights

Advanced Player Studio integrates clean DOM manipulation and modern Web APIs with a strictly typed, modular architecture.

### Key Implementation Details
* **DOM Hijacking & Re-parenting**: The UserScript scans host pages for active `<video>` tags. When hijacked, its original DOM hierarchy and playback state are saved, and the node is reparented into the studio overlay in-memory before mounting.
* **Dynamic WebVTT Native Casting**: Subtitles uploaded by the user are parsed client-side, timing-shifted dynamically, and natively cast as `VTTCue` objects to a programmable `TextTrack` (avoiding restrictive CSP boundaries associated with Blob URLs).
* **Web Audio API Graphing**: Connecting to the video's audio output creates an audio source node piped through an `AnalyserNode` and back to the speakers, allowing canvas renders of real-time frequencies.
* **Vanilla Functional Templates (No Heavy Frameworks):** The UI (`src/ui/template.ts`) is cleanly structured using composable string-returning functions. Heavy frameworks like Vue/React were explicitly avoided because the downstream `userscript.js` directly injects a static HTML payload (`.innerHTML`). This ensures high performance, zero build bloat, and perfect compatibility.

### Directory Structure
```text
src/
├── core/
│   └── PlayerStudio.ts      # The main orchestrator. Glues managers together.
├── managers/
│   ├── AudioVisualizer.ts   # Web Audio API context management & canvas rendering.
│   ├── FilterController.ts  # Video styling, SVG filters, and tint adjustments.
│   ├── InputController.ts   # Global keyboard hotkey event mapping.
│   ├── SubtitleEngine.ts    # SRT processing, VTTCue generation, and sync offsets.
│   ├── UIManager.ts         # Action logging and visual cue overlays.
│   └── VideoController.ts   # Core playback telemetry, zooming, panning, and chapters.
├── types/
│   └── index.ts             # TypeScript interfaces for strict typing.
├── ui/
│   └── template.ts          # Vanilla JS functional component template rendering.
├── utils/
│   └── time.ts              # Stateless utility functions for time conversions.
└── index.ts                 # Entry point that assigns the app to the global window.
```

---

## 🛠️ Development & Compilation

We use [esbuild](https://esbuild.github.io/) to instantly compile and pack the TypeScript modules.

1. **Install Dependencies:** 
   ```bash
   npm install
   ```
2. **Build the Project:** 
   ```bash
   npm run build
   ```
   > This automatically bundles `src/index.ts` to `dist/studio.js` and copies `index.html` and `userscript.js` to the `dist/` folder.

---

## ⌨️ Global Hotkeys Cheat Sheet

| Key | Action |
| :--- | :--- |
| **`Space`** | Play / Pause |
| **`←` / `→`** | Seek back / forward 5 seconds |
| **`J` / `L`** | Seek back / forward 10 seconds |
| **`0` - `9`** | Jump to 0% - 90% of the video duration |
| **`[` / `]`** | Decrease / Increase playback rate (0.5x - 4.0x) |
| **`M`** | Toggle mute |
| **`F`** | Toggle Fullscreen mode |
| **`Z` / `X`** | Shift subtitles backward / forward (±100ms adjustments) |
| **`Shift + G`**| Cycle Gamma Correction presets |
| **`Shift + C`**| Reset all visual filters to default |
| **`Mouse Wheel`** | Zoom in / out on video (1.0x to 5.0x) |
| **`Middle Click + Drag`** | Pan zoomed video viewport |

---

## 👥 Who
Advanced Player Studio is developed and maintained by **dev-ansung**.

### Contributions Welcome!
Have ideas for additional filter presets, custom canvas visualizers, hotkey modes, or platform compatibility upgrades? Contributions, pull requests, and bug reports are highly welcome! Feel free to fork the repository, open a pull request, or submit an issue.
