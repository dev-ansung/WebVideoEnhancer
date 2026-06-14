const Styles = () => `
    <style>
        #studio-overlay-container ::-webkit-scrollbar { width: 6px; }
        #studio-overlay-container ::-webkit-scrollbar-track { background: transparent; }
        #studio-overlay-container ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
        #studio-overlay-container ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .transcript-item { transition: background-color 0.2s, border-color 0.2s; }
        .transcript-item.active { background-color: rgba(59, 130, 246, 0.15); border-left-color: #3b82f6; }
    </style>
`;

const Header = () => `
    <header class="mb-6 flex flex-wrap justify-between items-center gap-4 border-b border-gray-800 pb-4">
        <div>
            <h1 class="text-2xl font-bold text-white">Advanced Player Studio</h1>
            <p class="text-sm text-gray-400 mt-1">v11</p>
        </div>
        <div class="flex gap-3">
            <button id="close-studio-btn" class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Close Studio
            </button>
            <label class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold transition shadow flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Load MP4 Video
                <input type="file" id="video-upload" accept="video/mp4,video/webm" class="hidden">
            </label>
        </div>
    </header>
`;

const VideoSection = () => `
    <section class="lg:col-span-8 flex flex-col gap-4 min-h-0 lg:overflow-y-auto lg:pr-2" id="video-column">
        <div id="player-wrapper" class="relative w-full aspect-video overflow-hidden shrink-0">
            <video-player class="w-full h-full block">
                <video-skin class="w-full h-full block">
                    </video-skin>
            </video-player>
            <div id="visual-cue" class="absolute top-6 right-6 bg-black/80 text-white px-4 py-2 rounded-lg font-mono text-sm opacity-0 transition-opacity z-50 pointer-events-none shadow-lg backdrop-blur-sm border border-gray-700">
                Sync: 0ms
            </div>
        </div>

        <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-800 shrink-0">
            <h3 class="font-semibold mb-3 text-sm text-gray-300">Global Hotkeys</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-2 text-xs text-gray-400">
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">Space</kbd> Play/Pause</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">← / →</kbd> Seek ±5s</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">J / L</kbd> Seek ±10s</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">M</kbd> Mute</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">F</kbd> Fullscreen</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">Z / X</kbd> Subs Sync ±100ms</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">[ / ]</kbd> Speed ±0.5x</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">0 - 9</kbd> Seek 0-90%</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">Wheel</kbd> Video Zoom</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">Mid Click</kbd> Video Pan</div>
            </div>
        </div>
        
        <div class="bg-gray-800/50 p-4 rounded-xl border border-gray-800 shrink-0">
            <h3 class="font-semibold mb-3 text-sm text-gray-300">Auto-Chapters (10ths)</h3>
            <div id="chapters-container" class="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div class="col-span-full text-gray-500 italic py-2">Load a video to generate chapters</div>
            </div>
        </div>
    </section>
`;

const TelemetryPanel = () => `
    <!-- Telemetry Panel -->
    <div class="bg-gray-800/80 p-4 rounded-xl border border-gray-800 shadow shrink-0 flex flex-col gap-3">
        <h3 class="font-semibold text-sm text-gray-300 border-b border-gray-700 pb-2 flex justify-between items-center">
            <span>Telemetry</span>
            <button id="toggle-visualizer" class="text-[10px] font-mono flex items-center gap-1 cursor-pointer select-none focus:outline-none bg-transparent border-0 p-0 text-green-500 hover:text-green-400 transition" title="Toggle audio visualizer">
                <span id="visualizer-status-dot" class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                AUDIO VISUALIZATION
            </button>
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span class="text-gray-500 text-[10px] block uppercase tracking-wider font-semibold mb-0.5">Zoom & Pan</span> <span id="tel-zoom" class="font-mono text-white">1.0x (0,0)</span></div>
            <div><span class="text-gray-500 text-[10px] block uppercase tracking-wider font-semibold mb-0.5">Sync Offset</span> <span id="tel-sync" class="font-mono text-purple-400">0 ms</span></div>
            <div><span class="text-gray-500 text-[10px] block uppercase tracking-wider font-semibold mb-0.5">Speed</span> <span id="tel-rate" class="font-mono text-white">1.0x</span></div>
            <div><span class="text-gray-500 text-[10px] block uppercase tracking-wider font-semibold mb-0.5">Volume</span> <span id="tel-vol" class="font-mono text-white">100%</span></div>
            <div><span class="text-gray-500 text-[10px] block uppercase tracking-wider font-semibold mb-0.5">Captions</span> <span id="tel-captions" class="font-mono text-white">Off</span></div>
        </div>
        <!-- Live Frequency Visualizer -->
        <div id="visualizer-wrapper" class="w-full h-10 bg-gray-950/60 rounded border border-gray-800/80 overflow-hidden relative">
            <canvas id="audio-visualizer" class="w-full h-full block"></canvas>
        </div>
    </div>
`;

const TranscriptPanel = (idx: number, type: string, pos: string) => `
    <div class="bg-gray-800/80 rounded-xl border border-gray-800 flex flex-col shadow transition-colors focus-within:border-blue-500/50">
        <h3 class="font-semibold p-2.5 border-b border-gray-700 text-xs text-gray-300 bg-gray-800/50 shrink-0 flex justify-between items-center rounded-t-xl">
            <span>Transcript ${idx} (${pos})</span>
            <span class="text-[10px] text-gray-500 font-mono">${type}</span>
        </h3>
        <div id="transcript-box-${idx}" class="overflow-y-auto p-0 text-sm bg-gray-900/30 relative resize-y min-h-[100px] max-h-[600px] h-[200px] rounded-b-xl custom-scrollbar" style="min-height: 100px;">
            <label for="srt-upload-${idx}" class="absolute inset-0 flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 cursor-pointer transition-colors text-xs italic min-h-[100px]">
                <svg class="w-6 h-6 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                <span>Load .srt ${idx}</span>
            </label>
        </div>
        <input type="file" id="srt-upload-${idx}" accept=".srt" class="hidden">
    </div>
`;

const AdvancedControls = () => `
    <!-- Advanced Controls Panel -->
    <div class="bg-gray-800/80 p-4 rounded-xl border border-gray-800 shadow shrink-0">
        <h3 class="font-semibold mb-3 text-sm text-gray-300 border-b border-gray-700 pb-2 flex justify-between items-center">
            <span>Advanced Controls</span>
            <div class="flex items-center gap-2">
                <button id="reset-filters-btn" class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 hover:text-white transition">Reset Filters</button>
                <span class="text-gray-700 text-[10px]">|</span>
                <button id="reset-subs-btn" class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 hover:text-white transition">Reset Subs</button>
            </div>
        </h3>
        
        <div class="flex flex-col gap-4">
            <!-- Section: Video Adjustments -->
            <div class="flex flex-col gap-3">
                <span class="font-bold text-[10px] text-blue-400 uppercase tracking-wider">Video Adjustments</span>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between font-mono text-[10px] text-gray-400">
                            <span>Gamma</span>
                            <span id="val-gamma">1.0x</span>
                        </div>
                        <input type="range" id="filter-gamma" min="0.5" max="2.5" step="0.1" value="1.0" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                    </div>
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between font-mono text-[10px] text-gray-400">
                            <span>Contrast</span>
                            <span id="val-contrast">100%</span>
                        </div>
                        <input type="range" id="filter-contrast" min="50" max="200" step="5" value="100" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                    </div>
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between font-mono text-[10px] text-gray-400">
                            <span>Brightness</span>
                            <span id="val-brightness">100%</span>
                        </div>
                        <input type="range" id="filter-brightness" min="50" max="200" step="5" value="100" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                    </div>
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between font-mono text-[10px] text-gray-400">
                            <span>Saturation</span>
                            <span id="val-saturation">100%</span>
                        </div>
                        <input type="range" id="filter-saturation" min="0" max="200" step="5" value="100" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                    </div>
                    <div class="flex flex-col gap-1 md:col-span-2">
                        <div class="flex justify-between font-mono text-[10px] text-gray-400">
                            <span>Hue Shift</span>
                            <span id="val-hue">0°</span>
                        </div>
                        <input type="range" id="filter-hue" min="0" max="360" step="10" value="0" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-2 border-t border-gray-700/50 pt-2 text-xs">
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between font-mono text-[10px] text-gray-400">
                            <span>Tint Color</span>
                            <span id="val-tint-color">#ffb000</span>
                        </div>
                        <input type="color" id="filter-tint-color" value="#ffb000" class="w-full h-6 bg-transparent border border-gray-700 rounded cursor-pointer p-0.5">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="font-mono text-[10px] text-gray-400">Tint Mode</span>
                        <select id="filter-tint-mode" class="bg-gray-950 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-300 focus:outline-none">
                            <option value="multiply" selected>Multiply</option>
                            <option value="screen">Screen</option>
                            <option value="overlay">Overlay</option>
                            <option value="color">Color</option>
                        </select>
                    </div>
                </div>
                <div class="flex flex-col gap-1 text-xs">
                    <div class="flex justify-between font-mono text-[10px] text-gray-400">
                        <span>Tint Intensity</span>
                        <span id="val-tint-intensity">0%</span>
                    </div>
                    <input type="range" id="filter-tint-intensity" min="0" max="100" step="5" value="0" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                </div>
            </div>
            
            <!-- Section: Subtitle Customization -->
            <div class="border-t border-gray-700 pt-3 flex flex-col gap-2">
                <span class="font-bold text-[10px] text-purple-400 uppercase tracking-wider">Subtitle Customization</span>
                <div class="grid grid-cols-2 gap-4 text-xs">
                    <!-- Track 1 Controls -->
                    <div class="flex flex-col gap-2 border-r border-gray-700 pr-2">
                        <span class="font-semibold text-[10px] text-purple-400/80 uppercase tracking-wider">Track 1 (Bottom)</span>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between font-mono text-[9px] text-gray-400">
                                <span>Pos Y</span>
                                <span id="val-sub-pos-0">0%</span>
                            </div>
                            <input type="range" id="sub-pos-0" min="0" max="100" step="5" value="0" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500">
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between font-mono text-[9px] text-gray-400">
                                <span>Font Size</span>
                                <span id="val-sub-size-0">16px</span>
                            </div>
                            <input type="range" id="sub-size-0" min="10" max="36" step="1" value="16" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500">
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between font-mono text-[9px] text-gray-400">
                                <span>Color</span>
                                <span id="val-sub-color-0">#ffffff</span>
                            </div>
                            <input type="color" id="sub-color-0" value="#ffffff" class="w-full h-6 bg-transparent border border-gray-700 rounded cursor-pointer p-0.5">
                        </div>
                    </div>
                    
                    <!-- Track 2 Controls -->
                    <div class="flex flex-col gap-2 pl-2">
                        <span class="font-semibold text-[10px] text-blue-400/80 uppercase tracking-wider">Track 2 (Top)</span>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between font-mono text-[9px] text-gray-400">
                                <span>Pos Y</span>
                                <span id="val-sub-pos-1">15%</span>
                            </div>
                            <input type="range" id="sub-pos-1" min="0" max="100" step="5" value="15" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between font-mono text-[9px] text-gray-400">
                                <span>Font Size</span>
                                <span id="val-sub-size-1">16px</span>
                            </div>
                            <input type="range" id="sub-size-1" min="10" max="36" step="1" value="16" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between font-mono text-[9px] text-gray-400">
                                <span>Color</span>
                                <span id="val-sub-color-1">#ffffff</span>
                            </div>
                            <input type="color" id="sub-color-1" value="#ffffff" class="w-full h-6 bg-transparent border border-gray-700 rounded cursor-pointer p-0.5">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

const ActionLog = () => `
    <!-- Action Log Panel -->
    <div class="bg-gray-800/80 rounded-xl border border-gray-800 flex flex-col shrink-0 shadow transition-colors">
        <h3 class="font-semibold p-3 border-b border-gray-700 text-sm text-gray-300 flex justify-between items-center bg-gray-800/50 shrink-0 rounded-t-xl">
            Action Log
            <button id="clear-log" class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 hover:text-white transition">Clear</button>
        </h3>
        <div id="action-log" class="overflow-y-auto p-3 font-mono text-[11px] text-green-400 space-y-1.5 bg-black/40 resize-y min-h-[100px] max-h-[600px] h-[160px] rounded-b-xl custom-scrollbar" style="min-height: 100px;"></div>
    </div>
`;

const SvgFilters = () => `
    <!-- SVG Filter for GPU-Accelerated Gamma Correction -->
    <svg style="position: absolute; width: 0; height: 0; pointer-events: none;" aria-hidden="true">
      <defs>
        <filter id="video-gamma">
          <feComponentTransfer>
            <feFuncR id="gamma-r" type="gamma" exponent="1.0"></feFuncR>
            <feFuncG id="gamma-g" type="gamma" exponent="1.0"></feFuncG>
            <feFuncB id="gamma-b" type="gamma" exponent="1.0"></feFuncB>
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
`;

export const TEMPLATE = `
<div class="bg-gray-900 text-gray-100 h-screen font-sans flex flex-col p-4 md:p-8 overflow-hidden" id="advanced-studio-app">
    ${Styles()}
    ${Header()}
    <main class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0 overflow-y-auto lg:overflow-hidden">
        ${VideoSection()}
        <aside class="lg:col-span-4 flex flex-col gap-4 h-full min-h-0 lg:overflow-y-auto lg:pr-2" id="controls-column">
            ${TelemetryPanel()}
            <div id="transcripts-wrapper" class="flex flex-col gap-4 flex-grow shrink-0 min-h-[300px]">
                ${TranscriptPanel(1, 'Primary', 'Bottom')}
                ${TranscriptPanel(2, 'Secondary', 'Top')}
            </div>
            ${AdvancedControls()}
            ${ActionLog()}
        </aside>
    </main>
    ${SvgFilters()}
</div>`;
