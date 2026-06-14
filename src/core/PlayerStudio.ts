import { UIManager } from '../managers/UIManager.js';
import { VideoController } from '../managers/VideoController.js';
import { SubtitleEngine } from '../managers/SubtitleEngine.js';
import { FilterController } from '../managers/FilterController.js';
import { AudioVisualizer } from '../managers/AudioVisualizer.js';
import { InputController } from '../managers/InputController.js';

export class PlayerStudio {
    container: HTMLElement;
    tintOverlay: HTMLElement | null = null;
    video: HTMLVideoElement;
    currentVideoUrl: string | null = null;

    ui: UIManager;
    videoCtrl: VideoController;
    subtitles: SubtitleEngine;
    filters: FilterController;
    audioVis: AudioVisualizer;
    input: InputController;

    constructor() {
        this.container = document.getElementById('player-wrapper')!;
        
        this.tintOverlay = document.getElementById('video-tint-overlay');
        if (this.container && !this.tintOverlay) {
            const videoSkin = this.container.querySelector('video-skin');
            if (videoSkin) {
                this.tintOverlay = document.createElement('div');
                this.tintOverlay.id = 'video-tint-overlay';
                this.tintOverlay.className = 'absolute inset-0 pointer-events-none transition-colors duration-100 mix-blend-multiply opacity-0';
                this.tintOverlay.style.backgroundColor = '#ffb000';
                videoSkin.appendChild(this.tintOverlay);
            }
        }

        let existingVideo = document.getElementById('main-video') as HTMLVideoElement;
        if (this.container && !existingVideo) {
            const videoSkin = this.container.querySelector('video-skin');
            if (videoSkin) {
                existingVideo = document.createElement('video');
                existingVideo.id = 'main-video';
                existingVideo.className = 'w-full h-full block';
                existingVideo.style.transition = 'transform 0.1s linear';
                existingVideo.style.transformOrigin = 'center';
                existingVideo.crossOrigin = 'anonymous';
                existingVideo.setAttribute('playsinline', '');
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
        this.ui.log('Studio initialized successfully.');
        this.videoCtrl.bindEvents();
        this.input.bind();

        document.getElementById('video-upload')?.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            if (this.currentVideoUrl) URL.revokeObjectURL(this.currentVideoUrl);

            this.currentVideoUrl = URL.createObjectURL(file);
            this.video.src = this.currentVideoUrl;
            this.video.load();
            this.ui.log(`Loaded Video: ${file.name}`);
            
            this.videoCtrl.scale = 1; this.videoCtrl.panX = 0; this.videoCtrl.panY = 0;
            this.videoCtrl.applyZoomPan();
        });

        [1, 2].forEach(num => {
            const idx = num - 1;
            document.getElementById(`srt-upload-${num}`)?.addEventListener('change', (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (evt) => {
                    this.ui.log(`Parsed Subtitle ${num}: ${file.name}`);
                    this.subtitles.processSRT((evt.target as FileReader).result as string, idx);
                };
                reader.readAsText(file);
            });
        });

        const toggleVisualizerEl = document.getElementById('toggle-visualizer');
        if (toggleVisualizerEl) {
            toggleVisualizerEl.addEventListener('click', () => this.audioVis.toggle());
        }

        const initAudioOnInteraction = () => {
            this.audioVis.init();
            this.audioVis.resume();
        };
        document.addEventListener('click', initAudioOnInteraction, { once: true });
        document.addEventListener('keydown', initAudioOnInteraction, { once: true });

        this.bindFilterEvents();
        this.bindSubtitleEvents();
    }

    private bindFilterEvents() {
        const controls = {
            gamma: { input: 'filter-gamma', val: 'val-gamma', unit: 'x', multiplier: 1 },
            contrast: { input: 'filter-contrast', val: 'val-contrast', unit: '%', multiplier: 1 },
            brightness: { input: 'filter-brightness', val: 'val-brightness', unit: '%', multiplier: 1 },
            saturation: { input: 'filter-saturation', val: 'val-saturation', unit: '%', multiplier: 1 },
            hue: { input: 'filter-hue', val: 'val-hue', unit: '°', multiplier: 1 }
        };

        Object.entries(controls).forEach(([key, config]) => {
            const inputEl = document.getElementById(config.input) as HTMLInputElement;
            const valEl = document.getElementById(config.val);
            if (inputEl) {
                inputEl.addEventListener('input', (e) => {
                    const value = parseFloat((e.target as HTMLInputElement).value);
                    (this.filters.filters as any)[key] = value;
                    if (valEl) {
                        valEl.innerText = `${value.toFixed(key === 'gamma' ? 1 : 0)}${config.unit}`;
                    }
                    this.filters.apply();
                });
            }
        });

        document.getElementById('reset-filters-btn')?.addEventListener('click', () => this.filters.reset());

        const tintColorEl = document.getElementById('filter-tint-color') as HTMLInputElement;
        const tintModeEl = document.getElementById('filter-tint-mode') as HTMLSelectElement;
        const tintIntensityEl = document.getElementById('filter-tint-intensity') as HTMLInputElement;

        if (tintColorEl) {
            tintColorEl.addEventListener('input', (e) => {
                this.filters.filters.tintColor = (e.target as HTMLInputElement).value;
                const valEl = document.getElementById('val-tint-color');
                if (valEl) valEl.innerText = (e.target as HTMLInputElement).value.toLowerCase();
                this.filters.apply();
            });
        }

        if (tintModeEl) {
            tintModeEl.addEventListener('change', (e) => {
                this.filters.filters.tintMode = (e.target as HTMLSelectElement).value;
                this.filters.apply();
            });
        }

        if (tintIntensityEl) {
            tintIntensityEl.addEventListener('input', (e) => {
                this.filters.filters.tintIntensity = parseInt((e.target as HTMLInputElement).value);
                const valEl = document.getElementById('val-tint-intensity');
                if (valEl) valEl.innerText = `${(e.target as HTMLInputElement).value}%`;
                this.filters.apply();
            });
        }
    }

    private bindSubtitleEvents() {
        [0, 1].forEach(idx => {
            const posEl = document.getElementById(`sub-pos-${idx}`) as HTMLInputElement;
            const sizeEl = document.getElementById(`sub-size-${idx}`) as HTMLInputElement;
            const colorEl = document.getElementById(`sub-color-${idx}`) as HTMLInputElement;
            
            if (posEl) {
                posEl.addEventListener('input', (e) => {
                    this.subtitles.subSettings[idx].pos = parseInt((e.target as HTMLInputElement).value);
                    const valPos = document.getElementById(`val-sub-pos-${idx}`);
                    if (valPos) valPos.innerText = `${(e.target as HTMLInputElement).value}%`;
                    this.subtitles.renderNativeTrack(idx); 
                });
            }
            
            if (sizeEl) {
                sizeEl.addEventListener('input', (e) => {
                    this.subtitles.subSettings[idx].size = parseInt((e.target as HTMLInputElement).value);
                    const valSize = document.getElementById(`val-sub-size-${idx}`);
                    if (valSize) valSize.innerText = `${(e.target as HTMLInputElement).value}px`;
                    this.applySubtitleStyles();
                });
            }
            
            if (colorEl) {
                colorEl.addEventListener('input', (e) => {
                    this.subtitles.subSettings[idx].color = (e.target as HTMLInputElement).value;
                    const valColor = document.getElementById(`val-sub-color-${idx}`);
                    if (valColor) valColor.innerText = (e.target as HTMLInputElement).value.toLowerCase();
                    this.applySubtitleStyles();
                });
            }
        });

        document.getElementById('reset-subs-btn')?.addEventListener('click', () => {
            this.subtitles.subSettings = [
                { pos: 0,  size: 16, color: '#ffffff' },
                { pos: 15, size: 16, color: '#ffffff' }
            ];

            [0, 1].forEach(idx => {
                const settings = this.subtitles.subSettings[idx];
                const posEl = document.getElementById(`sub-pos-${idx}`) as HTMLInputElement;
                const sizeEl = document.getElementById(`sub-size-${idx}`) as HTMLInputElement;
                const colorEl = document.getElementById(`sub-color-${idx}`) as HTMLInputElement;
                
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
            this.ui.log('Subtitle styles reset to default.');
        });

        this.applySubtitleStyles();
    }

    private applySubtitleStyles() {
        if (!this.video) return;
        [0, 1].forEach(idx => {
            const settings = this.subtitles.subSettings[idx];
            this.video.style.setProperty(`--track-${idx}-font-size`, `${settings.size}px`);
            this.video.style.setProperty(`--track-${idx}-color`, settings.color);
        });
    }
}
