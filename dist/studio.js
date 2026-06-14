(() => {
  // src/managers/UIManager.ts
  var UIManager = class {
    constructor(app) {
      this.app = app;
      this.logBox = document.getElementById("action-log");
      this.visualCue = document.getElementById("visual-cue");
      document.getElementById("clear-log")?.addEventListener("click", () => {
        this.logBox.innerHTML = "";
      });
    }
    app;
    logBox;
    visualCue;
    cueTimer = null;
    log(msg, isError = false) {
      const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const div = document.createElement("div");
      div.className = isError ? "text-red-400" : "text-green-400";
      div.innerText = `[${time}] ${msg}`;
      this.logBox.appendChild(div);
      this.logBox.scrollTop = this.logBox.scrollHeight;
    }
    showVisualCue(text) {
      this.visualCue.innerText = text;
      this.visualCue.style.opacity = "1";
      if (this.cueTimer) clearTimeout(this.cueTimer);
      this.cueTimer = setTimeout(() => {
        this.visualCue.style.opacity = "0";
      }, 1500);
    }
  };

  // src/utils/time.ts
  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
  }
  function formatTimeMs(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00.000";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    const ms = Math.floor(seconds % 1 * 1e3).toString().padStart(3, "0");
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}.${ms}` : `${m}:${s}.${ms}`;
  }
  function srtTimeToSeconds(timeStr) {
    const parts = timeStr.replace(",", ".").split(":");
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }

  // src/managers/VideoController.ts
  var VideoController = class {
    constructor(container, video, ui, audioVis) {
      this.container = container;
      this.video = video;
      this.ui = ui;
      this.audioVis = audioVis;
      this.chapContainer = document.getElementById("chapters-container");
    }
    container;
    video;
    ui;
    audioVis;
    scale = 1;
    panX = 0;
    panY = 0;
    isDraggingVideo = false;
    dragStartX = 0;
    dragStartY = 0;
    chapContainer;
    bindEvents() {
      this.video.addEventListener("play", () => {
        this.ui.log("Playback started");
        this.audioVis.init();
        this.audioVis.resume();
      });
      this.video.addEventListener("pause", () => this.ui.log("Playback paused"));
      this.video.addEventListener("volumechange", () => this.updateTelemetry());
      this.video.addEventListener("ratechange", () => this.updateTelemetry());
      this.video.addEventListener("loadedmetadata", () => {
        this.buildChapters();
        this.updateTelemetry();
      });
      this.video.textTracks.addEventListener("change", () => this.updateTelemetry());
      this.bindZoomPan();
    }
    updateTelemetry() {
      const volText = this.video.muted ? "Muted" : `${Math.round(this.video.volume * 100)}%`;
      document.getElementById("tel-vol").innerText = volText;
      document.getElementById("tel-rate").innerText = `${this.video.playbackRate.toFixed(1)}x`;
      let captionsActive = false;
      for (let i = 0; i < this.video.textTracks.length; i++) {
        if (this.video.textTracks[i].mode === "showing") {
          captionsActive = true;
          break;
        }
      }
      document.getElementById("tel-captions").innerText = captionsActive ? "On" : "Off";
    }
    buildChapters() {
      const dur = this.video.duration;
      this.chapContainer.innerHTML = "";
      if (!dur || !isFinite(dur)) {
        this.chapContainer.innerHTML = `<div class="col-span-full text-yellow-500 italic">Unable to read duration for chapters.</div>`;
        return;
      }
      const fraction = dur / 10;
      for (let i = 0; i < 10; i++) {
        const time = fraction * i;
        const btn = document.createElement("button");
        btn.className = "bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded p-2 text-left transition flex flex-col items-center justify-center text-center";
        btn.innerHTML = `<span class="font-semibold mb-1 text-gray-300">Key ${i}</span><span class="text-gray-400 font-mono">${formatTime(time)}</span>`;
        btn.addEventListener("click", () => {
          this.video.currentTime = time;
          if (this.video.paused) {
            this.video.play().catch((e) => this.ui.log(`Play error: ${e.message}`, true));
          }
          this.ui.log(`Jumped to Part ${i + 1} (${formatTime(time)})`);
        });
        this.chapContainer.appendChild(btn);
      }
    }
    applyZoomPan() {
      this.video.style.transform = `scale(${this.scale}) translate(${this.panX / this.scale}px, ${this.panY / this.scale}px)`;
      document.getElementById("tel-zoom").innerText = `${this.scale.toFixed(1)}x (${Math.round(this.panX)},${Math.round(this.panY)})`;
    }
    bindZoomPan() {
      this.container.addEventListener("wheel", (e) => {
        if (e.target.tagName !== "VIDEO") return;
        e.preventDefault();
        this.scale += e.deltaY * -1e-3;
        this.scale = Math.min(Math.max(1, this.scale), 5);
        if (this.scale === 1) {
          this.panX = 0;
          this.panY = 0;
        }
        this.applyZoomPan();
      });
      this.container.addEventListener("mousedown", (e) => {
        if (e.target.tagName !== "VIDEO") return;
        if (e.button === 1) {
          if (this.scale > 1) {
            this.isDraggingVideo = true;
            this.dragStartX = e.clientX - this.panX;
            this.dragStartY = e.clientY - this.panY;
            e.preventDefault();
          }
        }
      });
      window.addEventListener("mousemove", (e) => {
        if (!this.isDraggingVideo) return;
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
        this.applyZoomPan();
      });
      window.addEventListener("mouseup", () => {
        this.isDraggingVideo = false;
      });
    }
  };

  // src/managers/SubtitleEngine.ts
  var SubtitleEngine = class {
    constructor(video, ui) {
      this.video = video;
      this.ui = ui;
      this.transcriptBoxes = [
        document.getElementById("transcript-box-1"),
        document.getElementById("transcript-box-2")
      ];
    }
    video;
    ui;
    subtitles = [[], []];
    nativeTrack = [null, null];
    subSettings = [
      { pos: 0, size: 16, color: "#ffffff" },
      { pos: 15, size: 16, color: "#ffffff" }
    ];
    captionShift = 0;
    transcriptBoxes;
    processSRT(data, trackIdx) {
      const blocks = data.replace(/\r\n/g, "\n").trim().split("\n\n");
      this.subtitles[trackIdx] = [];
      blocks.forEach((block, index) => {
        const lines = block.split("\n");
        if (lines.length >= 3) {
          const timeLine = lines[1];
          const text = lines.slice(2).join("\n");
          const match = timeLine.match(/(\d+:\d+:\d+,\d+)\s*-->\s*(\d+:\d+:\d+,\d+)/);
          if (match) {
            this.subtitles[trackIdx].push({
              id: `cue-${index}`,
              start: srtTimeToSeconds(match[1]),
              end: srtTimeToSeconds(match[2]),
              text
            });
          }
        }
      });
      this.captionShift = 0;
      this.updateSyncUI();
      this.renderNativeTrack(trackIdx);
      this.buildTranscript(trackIdx);
    }
    renderNativeTrack(trackIdx) {
      if (this.subtitles[trackIdx].length === 0) return;
      const settings = this.subSettings[trackIdx];
      let textTrack = this.nativeTrack[trackIdx];
      if (!textTrack) {
        textTrack = this.video.addTextTrack(
          "subtitles",
          `Custom Track ${trackIdx + 1}`,
          trackIdx === 0 ? "en" : "es"
        );
        textTrack.mode = "showing";
        this.nativeTrack[trackIdx] = textTrack;
      } else {
        Array.from(textTrack.cues || []).forEach((c) => textTrack.removeCue(c));
      }
      this.subtitles[trackIdx].forEach((cue) => {
        try {
          const start = cue.start + this.captionShift;
          const end = cue.end + this.captionShift;
          const vttCue = new VTTCue(Math.max(0, start), Math.max(1e-3, end), cue.text);
          vttCue.id = String(cue.id);
          vttCue.snapToLines = false;
          vttCue.line = 100 - settings.pos;
          vttCue.align = "center";
          textTrack.addCue(vttCue);
        } catch (e) {
        }
      });
      textTrack.oncuechange = () => this.handleNativeCueChange(textTrack, trackIdx);
    }
    handleNativeCueChange(trackObj, trackIdx) {
      const activeCues = trackObj.activeCues;
      if (activeCues && activeCues.length > 0) {
        this.highlightTranscript(activeCues[0].id, trackIdx);
      } else {
        this.highlightTranscript(null, trackIdx);
      }
    }
    buildTranscript(trackIdx) {
      const tBox = this.transcriptBoxes[trackIdx];
      tBox.innerHTML = "";
      if (this.subtitles[trackIdx].length === 0) {
        tBox.innerHTML = `
                <label for="srt-upload-${trackIdx + 1}" class="absolute inset-0 flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 cursor-pointer transition-colors text-xs italic min-h-[100px]">
                    <svg class="w-6 h-6 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    <span>Load .srt ${trackIdx + 1}</span>
                </label>
            `;
        return;
      }
      this.subtitles[trackIdx].forEach((cue) => {
        const li = document.createElement("div");
        li.className = "transcript-item p-3 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/80 flex gap-3 border-l-4 border-l-transparent text-gray-300";
        li.id = `transcript-${trackIdx}-${cue.id}`;
        const rawText = cue.text.replace(/<br>/g, " ").replace(/<[^>]+>/g, "");
        const displayTime = Math.max(0, cue.start + this.captionShift);
        li.innerHTML = `<span class="text-purple-400 font-mono shrink-0 text-xs mt-0.5">[${formatTimeMs(displayTime)}]</span> <span>${rawText}</span>`;
        li.addEventListener("click", () => {
          this.video.currentTime = Math.max(0, cue.start + this.captionShift);
          if (this.video.paused) {
            this.video.play().catch((e) => this.ui.log(`Play error: ${e.message}`, true));
          }
          this.ui.log(`Seek to transcript ${trackIdx + 1}: ${formatTime(displayTime)}`);
        });
        tBox.appendChild(li);
      });
    }
    highlightTranscript(cueId, trackIdx) {
      const tBox = this.transcriptBoxes[trackIdx];
      const old = tBox.querySelector(".transcript-item.active");
      if (old) old.classList.remove("active");
      if (cueId) {
        const current = document.getElementById(`transcript-${trackIdx}-${cueId}`);
        if (current) current.classList.add("active");
      }
    }
    updateSyncUI() {
      const ms = Math.round(this.captionShift * 1e3);
      const sign = ms > 0 ? "+" : "";
      this.ui.showVisualCue(`Sync: ${sign}${ms}ms`);
      document.getElementById("tel-sync").innerText = `${sign}${ms} ms`;
      if (ms % 500 === 0) this.ui.log(`Caption sync shifted to ${sign}${ms}ms`);
    }
    shift(delta) {
      this.captionShift += delta;
      this.updateSyncUI();
      this.renderNativeTrack(0);
      this.renderNativeTrack(1);
      this.buildTranscript(0);
      this.buildTranscript(1);
    }
  };

  // src/managers/FilterController.ts
  var FilterController = class {
    constructor(video, tintOverlay, ui) {
      this.video = video;
      this.tintOverlay = tintOverlay;
      this.ui = ui;
    }
    video;
    tintOverlay;
    ui;
    filters = this.getDefaults();
    getDefaults() {
      return {
        gamma: 1,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        tintColor: "#ffb000",
        tintMode: "multiply",
        tintIntensity: 0
      };
    }
    apply() {
      if (!this.video) return;
      const exponent = 1 / this.filters.gamma;
      ["gamma-r", "gamma-g", "gamma-b"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute("exponent", exponent.toString());
      });
      this.video.style.filter = `url(#video-gamma) brightness(${this.filters.brightness}%) contrast(${this.filters.contrast}%) saturate(${this.filters.saturation}%) hue-rotate(${this.filters.hue}deg)`;
      if (this.tintOverlay) {
        this.tintOverlay.style.backgroundColor = this.filters.tintColor;
        this.tintOverlay.style.mixBlendMode = this.filters.tintMode;
        this.tintOverlay.style.opacity = (this.filters.tintIntensity / 100).toString();
      }
    }
    reset() {
      this.filters = this.getDefaults();
      const controls = {
        gamma: { input: "filter-gamma", val: "val-gamma", default: "1.0x" },
        contrast: { input: "filter-contrast", val: "val-contrast", default: "100%" },
        brightness: { input: "filter-brightness", val: "val-brightness", default: "100%" },
        saturation: { input: "filter-saturation", val: "val-saturation", default: "100%" },
        hue: { input: "filter-hue", val: "val-hue", default: "0\xB0" }
      };
      Object.entries(controls).forEach(([key, config]) => {
        const inputEl = document.getElementById(config.input);
        const valEl = document.getElementById(config.val);
        if (inputEl) inputEl.value = this.filters[key].toString();
        if (valEl) valEl.innerText = config.default;
      });
      const tintColorEl = document.getElementById("filter-tint-color");
      const tintModeEl = document.getElementById("filter-tint-mode");
      const tintIntensityEl = document.getElementById("filter-tint-intensity");
      if (tintColorEl) tintColorEl.value = this.filters.tintColor;
      if (tintModeEl) tintModeEl.value = this.filters.tintMode;
      if (tintIntensityEl) tintIntensityEl.value = this.filters.tintIntensity.toString();
      const valTintColor = document.getElementById("val-tint-color");
      const valTintIntensity = document.getElementById("val-tint-intensity");
      if (valTintColor) valTintColor.innerText = this.filters.tintColor;
      if (valTintIntensity) valTintIntensity.innerText = "0%";
      this.apply();
      this.ui.log("Video filters reset to default.");
    }
  };

  // src/managers/AudioVisualizer.ts
  var AudioVisualizer = class {
    constructor(video, ui) {
      this.video = video;
      this.ui = ui;
    }
    video;
    ui;
    audioConnected = false;
    audioCtx = null;
    analyser = null;
    audioSource = null;
    visualizerEnabled = true;
    init() {
      if (this.audioConnected) return;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.audioSource = this.audioCtx.createMediaElementSource(this.video);
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        this.audioConnected = true;
        this.ui.log("Web Audio Context connected to video element.");
        this.startVisualizerRender();
      } catch (err) {
        console.warn(`AudioContext connection skipped (CORS/Gesture): ${err.message}`);
      }
    }
    resume() {
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
    }
    toggle() {
      this.visualizerEnabled = !this.visualizerEnabled;
      const wrapper = document.getElementById("visualizer-wrapper");
      const dot = document.getElementById("visualizer-status-dot");
      const toggleVisualizerEl = document.getElementById("toggle-visualizer");
      if (this.visualizerEnabled) {
        if (wrapper) wrapper.classList.remove("hidden");
        if (toggleVisualizerEl) toggleVisualizerEl.className = "text-[10px] font-mono flex items-center gap-1 cursor-pointer select-none focus:outline-none bg-transparent border-0 p-0 text-green-500 hover:text-green-400 transition";
        if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse";
      } else {
        if (wrapper) wrapper.classList.add("hidden");
        if (toggleVisualizerEl) toggleVisualizerEl.className = "text-[10px] font-mono flex items-center gap-1 cursor-pointer select-none focus:outline-none bg-transparent border-0 p-0 text-gray-500 hover:text-gray-400 transition";
        if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-gray-500";
      }
      this.ui.log(`Audio visualizer ${this.visualizerEnabled ? "enabled" : "disabled"}`);
    }
    startVisualizerRender() {
      const canvas = document.getElementById("audio-visualizer");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const resizeCanvas = () => {
        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;
      };
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      const draw = () => {
        requestAnimationFrame(draw);
        if (!this.audioConnected || !this.visualizerEnabled) return;
        this.analyser.getByteFrequencyData(dataArray);
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        const barWidth = width / bufferLength * 0.8;
        const barGap = width / bufferLength * 0.2;
        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = percent * height;
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, "#3b82f6");
          gradient.addColorStop(1, "#a855f7");
          ctx.fillStyle = gradient;
          const x = i * (barWidth + barGap);
          const y = height - barHeight;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      };
      draw();
    }
  };

  // src/managers/InputController.ts
  var InputController = class {
    constructor(app) {
      this.app = app;
    }
    app;
    bind() {
      document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (!this.app.video || !this.app.video.isConnected) return;
        const p = () => {
          e.preventDefault();
          e.stopPropagation();
        };
        const key = e.key.toLowerCase();
        if (e.shiftKey) {
          if (key === "g") {
            p();
            const values = [1, 1.3, 1.6, 1.9, 0.7];
            let nextIdx = (values.indexOf(parseFloat(this.app.filters.filters.gamma.toFixed(1))) + 1) % values.length;
            this.app.filters.filters.gamma = values[nextIdx];
            const inputEl = document.getElementById("filter-gamma");
            const valEl = document.getElementById("val-gamma");
            if (inputEl) inputEl.value = this.app.filters.filters.gamma.toString();
            if (valEl) valEl.innerText = `${this.app.filters.filters.gamma.toFixed(1)}x`;
            this.app.filters.apply();
            this.app.ui.showVisualCue(`Gamma: ${this.app.filters.filters.gamma.toFixed(1)}x`);
            this.app.ui.log(`Gamma cycled to ${this.app.filters.filters.gamma.toFixed(1)}x`);
            return;
          }
          if (key === "c") {
            p();
            this.app.filters.reset();
            this.app.ui.showVisualCue("Filters Reset");
            return;
          }
        }
        switch (key) {
          case " ":
            p();
            this.app.video.paused ? this.app.video.play().catch((err) => this.app.ui.log(err.message, true)) : this.app.video.pause();
            this.app.ui.showVisualCue(this.app.video.paused ? "Paused" : "Play");
            break;
          case "arrowleft":
            p();
            this.app.video.currentTime = Math.max(0, this.app.video.currentTime - 5);
            this.app.ui.showVisualCue("-5s");
            break;
          case "arrowright":
            p();
            this.app.video.currentTime = Math.min(this.app.video.duration, this.app.video.currentTime + 5);
            this.app.ui.showVisualCue("+5s");
            break;
          case "j":
            p();
            this.app.video.currentTime = Math.max(0, this.app.video.currentTime - 10);
            this.app.ui.showVisualCue("-10s");
            break;
          case "l":
            p();
            this.app.video.currentTime = Math.min(this.app.video.duration, this.app.video.currentTime + 10);
            this.app.ui.showVisualCue("+10s");
            break;
          case "[":
            p();
            this.app.video.playbackRate = Math.max(0.5, this.app.video.playbackRate - 0.5);
            this.app.ui.showVisualCue(`${this.app.video.playbackRate.toFixed(1)}x`);
            break;
          case "]":
            p();
            this.app.video.playbackRate = Math.min(4, this.app.video.playbackRate + 0.5);
            this.app.ui.showVisualCue(`${this.app.video.playbackRate.toFixed(1)}x`);
            break;
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            p();
            if (this.app.video.duration) {
              const percentage = parseInt(e.key) * 10;
              this.app.video.currentTime = percentage / 100 * this.app.video.duration;
              this.app.ui.showVisualCue(`${percentage}%`);
            }
            break;
          case "m":
            p();
            this.app.video.muted = !this.app.video.muted;
            this.app.ui.showVisualCue(this.app.video.muted ? "Muted" : "Unmuted");
            break;
          case "f":
            p();
            if (!document.fullscreenElement) {
              this.app.container.requestFullscreen().then(() => this.app.ui.showVisualCue("Fullscreen Mode")).catch((err) => this.app.ui.log(`Fullscreen rejected: ${err.message}`, true));
            } else {
              document.exitFullscreen().then(() => this.app.ui.showVisualCue("Exit Fullscreen")).catch((err) => this.app.ui.log(`Exit fullscreen rejected: ${err.message}`, true));
            }
            break;
          case "z":
            p();
            this.app.subtitles.shift(-0.1);
            break;
          case "x":
            p();
            this.app.subtitles.shift(0.1);
            break;
        }
      }, true);
    }
  };

  // src/core/PlayerStudio.ts
  var PlayerStudio = class {
    container;
    tintOverlay = null;
    video;
    currentVideoUrl = null;
    ui;
    videoCtrl;
    subtitles;
    filters;
    audioVis;
    input;
    constructor() {
      this.container = document.getElementById("player-wrapper");
      this.tintOverlay = document.getElementById("video-tint-overlay");
      if (this.container && !this.tintOverlay) {
        const videoSkin = this.container.querySelector("video-skin");
        if (videoSkin) {
          this.tintOverlay = document.createElement("div");
          this.tintOverlay.id = "video-tint-overlay";
          this.tintOverlay.className = "absolute inset-0 pointer-events-none transition-colors duration-100 mix-blend-multiply opacity-0";
          this.tintOverlay.style.backgroundColor = "#ffb000";
          videoSkin.appendChild(this.tintOverlay);
        }
      }
      let existingVideo = document.getElementById("main-video");
      if (this.container && !existingVideo) {
        const videoSkin = this.container.querySelector("video-skin");
        if (videoSkin) {
          existingVideo = document.createElement("video");
          existingVideo.id = "main-video";
          existingVideo.className = "w-full h-full block";
          existingVideo.style.transition = "transform 0.1s linear";
          existingVideo.style.transformOrigin = "center";
          existingVideo.crossOrigin = "anonymous";
          existingVideo.setAttribute("playsinline", "");
          videoSkin.insertBefore(existingVideo, this.tintOverlay);
        }
      }
      this.video = existingVideo;
      this.ui = new UIManager(this);
      this.audioVis = new AudioVisualizer(this.video, this.ui);
      this.videoCtrl = new VideoController(this.container, this.video, this.ui, this.audioVis);
      this.subtitles = new SubtitleEngine(this.video, this.ui);
      this.filters = new FilterController(this.video, this.tintOverlay, this.ui);
      this.input = new InputController(this);
    }
    init() {
      this.ui.log("Studio initialized successfully.");
      this.videoCtrl.bindEvents();
      this.input.bind();
      document.getElementById("video-upload")?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (this.currentVideoUrl) URL.revokeObjectURL(this.currentVideoUrl);
        this.currentVideoUrl = URL.createObjectURL(file);
        this.video.src = this.currentVideoUrl;
        this.video.load();
        this.ui.log(`Loaded Video: ${file.name}`);
        this.videoCtrl.scale = 1;
        this.videoCtrl.panX = 0;
        this.videoCtrl.panY = 0;
        this.videoCtrl.applyZoomPan();
      });
      [1, 2].forEach((num) => {
        const idx = num - 1;
        document.getElementById(`srt-upload-${num}`)?.addEventListener("change", (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.ui.log(`Parsed Subtitle ${num}: ${file.name}`);
            this.subtitles.processSRT(evt.target.result, idx);
          };
          reader.readAsText(file);
        });
      });
      const toggleVisualizerEl = document.getElementById("toggle-visualizer");
      if (toggleVisualizerEl) {
        toggleVisualizerEl.addEventListener("click", () => this.audioVis.toggle());
      }
      const initAudioOnInteraction = () => {
        this.audioVis.init();
        this.audioVis.resume();
      };
      document.addEventListener("click", initAudioOnInteraction, { once: true });
      document.addEventListener("keydown", initAudioOnInteraction, { once: true });
      this.bindFilterEvents();
      this.bindSubtitleEvents();
    }
    bindFilterEvents() {
      const controls = {
        gamma: { input: "filter-gamma", val: "val-gamma", unit: "x", multiplier: 1 },
        contrast: { input: "filter-contrast", val: "val-contrast", unit: "%", multiplier: 1 },
        brightness: { input: "filter-brightness", val: "val-brightness", unit: "%", multiplier: 1 },
        saturation: { input: "filter-saturation", val: "val-saturation", unit: "%", multiplier: 1 },
        hue: { input: "filter-hue", val: "val-hue", unit: "\xB0", multiplier: 1 }
      };
      Object.entries(controls).forEach(([key, config]) => {
        const inputEl = document.getElementById(config.input);
        const valEl = document.getElementById(config.val);
        if (inputEl) {
          inputEl.addEventListener("input", (e) => {
            const value = parseFloat(e.target.value);
            this.filters.filters[key] = value;
            if (valEl) {
              valEl.innerText = `${value.toFixed(key === "gamma" ? 1 : 0)}${config.unit}`;
            }
            this.filters.apply();
          });
        }
      });
      document.getElementById("reset-filters-btn")?.addEventListener("click", () => this.filters.reset());
      const tintColorEl = document.getElementById("filter-tint-color");
      const tintModeEl = document.getElementById("filter-tint-mode");
      const tintIntensityEl = document.getElementById("filter-tint-intensity");
      if (tintColorEl) {
        tintColorEl.addEventListener("input", (e) => {
          this.filters.filters.tintColor = e.target.value;
          const valEl = document.getElementById("val-tint-color");
          if (valEl) valEl.innerText = e.target.value.toLowerCase();
          this.filters.apply();
        });
      }
      if (tintModeEl) {
        tintModeEl.addEventListener("change", (e) => {
          this.filters.filters.tintMode = e.target.value;
          this.filters.apply();
        });
      }
      if (tintIntensityEl) {
        tintIntensityEl.addEventListener("input", (e) => {
          this.filters.filters.tintIntensity = parseInt(e.target.value);
          const valEl = document.getElementById("val-tint-intensity");
          if (valEl) valEl.innerText = `${e.target.value}%`;
          this.filters.apply();
        });
      }
    }
    bindSubtitleEvents() {
      [0, 1].forEach((idx) => {
        const posEl = document.getElementById(`sub-pos-${idx}`);
        const sizeEl = document.getElementById(`sub-size-${idx}`);
        const colorEl = document.getElementById(`sub-color-${idx}`);
        if (posEl) {
          posEl.addEventListener("input", (e) => {
            this.subtitles.subSettings[idx].pos = parseInt(e.target.value);
            const valPos = document.getElementById(`val-sub-pos-${idx}`);
            if (valPos) valPos.innerText = `${e.target.value}%`;
            this.subtitles.renderNativeTrack(idx);
          });
        }
        if (sizeEl) {
          sizeEl.addEventListener("input", (e) => {
            this.subtitles.subSettings[idx].size = parseInt(e.target.value);
            const valSize = document.getElementById(`val-sub-size-${idx}`);
            if (valSize) valSize.innerText = `${e.target.value}px`;
            this.applySubtitleStyles();
          });
        }
        if (colorEl) {
          colorEl.addEventListener("input", (e) => {
            this.subtitles.subSettings[idx].color = e.target.value;
            const valColor = document.getElementById(`val-sub-color-${idx}`);
            if (valColor) valColor.innerText = e.target.value.toLowerCase();
            this.applySubtitleStyles();
          });
        }
      });
      document.getElementById("reset-subs-btn")?.addEventListener("click", () => {
        this.subtitles.subSettings = [
          { pos: 0, size: 16, color: "#ffffff" },
          { pos: 15, size: 16, color: "#ffffff" }
        ];
        [0, 1].forEach((idx) => {
          const settings = this.subtitles.subSettings[idx];
          const posEl = document.getElementById(`sub-pos-${idx}`);
          const sizeEl = document.getElementById(`sub-size-${idx}`);
          const colorEl = document.getElementById(`sub-color-${idx}`);
          if (posEl) posEl.value = settings.pos.toString();
          if (sizeEl) sizeEl.value = settings.size.toString();
          if (colorEl) colorEl.value = settings.color;
          const valPos = document.getElementById(`val-sub-pos-${idx}`);
          const valSize = document.getElementById(`val-sub-size-${idx}`);
          const valColor = document.getElementById(`val-sub-color-${idx}`);
          if (valPos) valPos.innerText = `${settings.pos}%`;
          if (valSize) valSize.innerText = `${settings.size}px`;
          if (valColor) valColor.innerText = settings.color.toLowerCase();
          this.subtitles.renderNativeTrack(idx);
        });
        this.applySubtitleStyles();
        this.ui.log("Subtitle styles reset to default.");
      });
      this.applySubtitleStyles();
    }
    applySubtitleStyles() {
      if (!this.video) return;
      [0, 1].forEach((idx) => {
        const settings = this.subtitles.subSettings[idx];
        this.video.style.setProperty(`--track-${idx}-font-size`, `${settings.size}px`);
        this.video.style.setProperty(`--track-${idx}-color`, settings.color);
      });
    }
  };

  // src/ui/template.ts
  var Styles = () => `
    <style>
        #studio-overlay-container ::-webkit-scrollbar { width: 6px; }
        #studio-overlay-container ::-webkit-scrollbar-track { background: transparent; }
        #studio-overlay-container ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
        #studio-overlay-container ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .transcript-item { transition: background-color 0.2s, border-color 0.2s; }
        .transcript-item.active { background-color: rgba(59, 130, 246, 0.15); border-left-color: #3b82f6; }
    </style>
`;
  var Header = () => `
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
  var VideoSection = () => `
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
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">\u2190 / \u2192</kbd> Seek \xB15s</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">J / L</kbd> Seek \xB110s</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">M</kbd> Mute</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">F</kbd> Fullscreen</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">Z / X</kbd> Subs Sync \xB1100ms</div>
                <div class="flex items-center gap-2"><kbd class="bg-gray-700 px-1.5 py-0.5 rounded text-white shadow-sm border border-gray-600 font-mono">[ / ]</kbd> Speed \xB10.5x</div>
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
  var TelemetryPanel = () => `
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
  var TranscriptPanel = (idx, type, pos) => `
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
  var AdvancedControls = () => `
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
                            <span id="val-hue">0\xB0</span>
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
  var ActionLog = () => `
    <!-- Action Log Panel -->
    <div class="bg-gray-800/80 rounded-xl border border-gray-800 flex flex-col shrink-0 shadow transition-colors">
        <h3 class="font-semibold p-3 border-b border-gray-700 text-sm text-gray-300 flex justify-between items-center bg-gray-800/50 shrink-0 rounded-t-xl">
            Action Log
            <button id="clear-log" class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 hover:text-white transition">Clear</button>
        </h3>
        <div id="action-log" class="overflow-y-auto p-3 font-mono text-[11px] text-green-400 space-y-1.5 bg-black/40 resize-y min-h-[100px] max-h-[600px] h-[160px] rounded-b-xl custom-scrollbar" style="min-height: 100px;"></div>
    </div>
`;
  var SvgFilters = () => `
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
  var TEMPLATE = `
<div class="bg-gray-900 text-gray-100 h-screen font-sans flex flex-col p-4 md:p-8 overflow-hidden" id="advanced-studio-app">
    ${Styles()}
    ${Header()}
    <main class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0 overflow-y-auto lg:overflow-hidden">
        ${VideoSection()}
        <aside class="lg:col-span-4 flex flex-col gap-4 h-full min-h-0 lg:overflow-y-auto lg:pr-2" id="controls-column">
            ${TelemetryPanel()}
            <div id="transcripts-wrapper" class="flex flex-col gap-4 flex-grow shrink-0 min-h-[300px]">
                ${TranscriptPanel(1, "Primary", "Bottom")}
                ${TranscriptPanel(2, "Secondary", "Top")}
            </div>
            ${AdvancedControls()}
            ${ActionLog()}
        </aside>
    </main>
    ${SvgFilters()}
</div>`;

  // src/index.ts
  window.PlayerStudio = PlayerStudio;
  window.PlayerStudio.TEMPLATE = TEMPLATE;
})();
