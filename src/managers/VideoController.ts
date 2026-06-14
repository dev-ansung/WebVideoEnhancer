import { formatTime } from '../utils/time.js';

export class VideoController {
    scale = 1;
    panX = 0;
    panY = 0;
    isDraggingVideo = false;
    dragStartX = 0;
    dragStartY = 0;
    private chapContainer: HTMLElement;

    constructor(private container: HTMLElement, public video: HTMLVideoElement, private ui: any, private audioVis: any) {
        this.chapContainer = document.getElementById('chapters-container')!;
    }

    bindEvents() {
        this.video.addEventListener('play', () => {
            this.ui.log('Playback started');
            this.audioVis.init();
            this.audioVis.resume();
        });
        this.video.addEventListener('pause', () => this.ui.log('Playback paused'));
        this.video.addEventListener('volumechange', () => this.updateTelemetry());
        this.video.addEventListener('ratechange', () => this.updateTelemetry());
        this.video.addEventListener('loadedmetadata', () => {
            this.buildChapters();
            this.updateTelemetry();
        });
        this.video.textTracks.addEventListener('change', () => this.updateTelemetry());

        this.bindZoomPan();
    }

    updateTelemetry() {
        const volText = this.video.muted ? 'Muted' : `${Math.round(this.video.volume * 100)}%`;
        document.getElementById('tel-vol')!.innerText = volText;
        document.getElementById('tel-rate')!.innerText = `${this.video.playbackRate.toFixed(1)}x`;
        
        let captionsActive = false;
        for(let i = 0; i < this.video.textTracks.length; i++) {
            if (this.video.textTracks[i].mode === 'showing') { captionsActive = true; break; }
        }
        document.getElementById('tel-captions')!.innerText = captionsActive ? 'On' : 'Off';
    }

    private buildChapters() {
        const dur = this.video.duration;
        this.chapContainer.innerHTML = '';
        
        if (!dur || !isFinite(dur)) {
            this.chapContainer.innerHTML = `<div class="col-span-full text-yellow-500 italic">Unable to read duration for chapters.</div>`;
            return;
        }

        const fraction = dur / 10;
        for(let i = 0; i < 10; i++) {
            const time = fraction * i;
            const btn = document.createElement('button');
            btn.className = "bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded p-2 text-left transition flex flex-col items-center justify-center text-center";
            btn.innerHTML = `<span class="font-semibold mb-1 text-gray-300">Key ${i}</span><span class="text-gray-400 font-mono">${formatTime(time)}</span>`;
            
            btn.addEventListener('click', () => {
                this.video.currentTime = time;
                if(this.video.paused) { this.video.play().catch(e => this.ui.log(`Play error: ${(e as Error).message}`, true)); }
                this.ui.log(`Jumped to Part ${i+1} (${formatTime(time)})`);
            });
            this.chapContainer.appendChild(btn);
        }
    }

    applyZoomPan() {
        this.video.style.transform = `scale(${this.scale}) translate(${this.panX/this.scale}px, ${this.panY/this.scale}px)`;
        document.getElementById('tel-zoom')!.innerText = `${this.scale.toFixed(1)}x (${Math.round(this.panX)},${Math.round(this.panY)})`;
    }

    private bindZoomPan() {
        this.container.addEventListener('wheel', (e) => {
            if ((e.target as HTMLElement).tagName !== 'VIDEO') return;
            e.preventDefault();
            this.scale += e.deltaY * -0.001;
            this.scale = Math.min(Math.max(1, this.scale), 5);
            if (this.scale === 1) { this.panX = 0; this.panY = 0; }
            this.applyZoomPan();
        });

        this.container.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).tagName !== 'VIDEO') return;
            if (e.button === 1) {
                if (this.scale > 1) {
                    this.isDraggingVideo = true;
                    this.dragStartX = e.clientX - this.panX;
                    this.dragStartY = e.clientY - this.panY;
                    e.preventDefault();
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDraggingVideo) return;
            this.panX = e.clientX - this.dragStartX;
            this.panY = e.clientY - this.dragStartY;
            this.applyZoomPan();
        });

        window.addEventListener('mouseup', () => { this.isDraggingVideo = false; });
    }
}
