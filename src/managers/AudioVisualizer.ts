export class AudioVisualizer {
    audioConnected = false;
    audioCtx: AudioContext | null = null;
    analyser: AnalyserNode | null = null;
    audioSource: MediaElementAudioSourceNode | null = null;
    visualizerEnabled = true;

    constructor(private video: HTMLVideoElement, private ui: any) {}

    init() {
        if (this.audioConnected) return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioCtx = new AudioContextClass();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 64; 

            this.audioSource = this.audioCtx.createMediaElementSource(this.video);
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
            
            this.audioConnected = true;
            this.ui.log('Web Audio Context connected to video element.');

            this.startVisualizerRender();
        } catch (err) {
            console.warn(`AudioContext connection skipped (CORS/Gesture): ${(err as Error).message}`);
        }
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    toggle() {
        this.visualizerEnabled = !this.visualizerEnabled;
        const wrapper = document.getElementById('visualizer-wrapper');
        const dot = document.getElementById('visualizer-status-dot');
        const toggleVisualizerEl = document.getElementById('toggle-visualizer');
        
        if (this.visualizerEnabled) {
            if (wrapper) wrapper.classList.remove('hidden');
            if (toggleVisualizerEl) toggleVisualizerEl.className = "text-[10px] font-mono flex items-center gap-1 cursor-pointer select-none focus:outline-none bg-transparent border-0 p-0 text-green-500 hover:text-green-400 transition";
            if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse";
        } else {
            if (wrapper) wrapper.classList.add('hidden');
            if (toggleVisualizerEl) toggleVisualizerEl.className = "text-[10px] font-mono flex items-center gap-1 cursor-pointer select-none focus:outline-none bg-transparent border-0 p-0 text-gray-500 hover:text-gray-400 transition";
            if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-gray-500";
        }
        this.ui.log(`Audio visualizer ${this.visualizerEnabled ? 'enabled' : 'disabled'}`);
    }

    private startVisualizerRender() {
        const canvas = document.getElementById('audio-visualizer') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const bufferLength = this.analyser!.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const resizeCanvas = () => {
            canvas.width = canvas.clientWidth * window.devicePixelRatio;
            canvas.height = canvas.clientHeight * window.devicePixelRatio;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const draw = () => {
            requestAnimationFrame(draw);
            if (!this.audioConnected || !this.visualizerEnabled) return;

            this.analyser!.getByteFrequencyData(dataArray);

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 0.8;
            const barGap = (width / bufferLength) * 0.2;
            
            for (let i = 0; i < bufferLength; i++) {
                const percent = dataArray[i] / 255;
                const barHeight = percent * height;

                const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                gradient.addColorStop(0, '#3b82f6');
                gradient.addColorStop(1, '#a855f7');

                ctx.fillStyle = gradient;
                
                const x = i * (barWidth + barGap);
                const y = height - barHeight;
                if ((ctx as any).roundRect) {
                    ctx.beginPath();
                    (ctx as any).roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y, barWidth, barHeight);
                }
            }
        };

        draw();
    }
}
