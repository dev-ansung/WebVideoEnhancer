export class InputController {
    constructor(private app: any) {}

    bind() {
        document.addEventListener('keydown', (e) => {
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
            if (!this.app.video || !this.app.video.isConnected) return;

            const p = () => { e.preventDefault(); e.stopPropagation(); };
            const key = e.key.toLowerCase();

            if (e.shiftKey) {
                if (key === 'g') {
                    p();
                    const values = [1.0, 1.3, 1.6, 1.9, 0.7];
                    let nextIdx = (values.indexOf(parseFloat(this.app.filters.filters.gamma.toFixed(1))) + 1) % values.length;
                    this.app.filters.filters.gamma = values[nextIdx];
                    
                    const inputEl = document.getElementById('filter-gamma') as HTMLInputElement;
                    const valEl = document.getElementById('val-gamma');
                    if (inputEl) inputEl.value = this.app.filters.filters.gamma.toString();
                    if (valEl) valEl.innerText = `${this.app.filters.filters.gamma.toFixed(1)}x`;
                    
                    this.app.filters.apply();
                    this.app.ui.showVisualCue(`Gamma: ${this.app.filters.filters.gamma.toFixed(1)}x`);
                    this.app.ui.log(`Gamma cycled to ${this.app.filters.filters.gamma.toFixed(1)}x`);
                    return;
                }
                if (key === 'c') {
                    p();
                    this.app.filters.reset();
                    this.app.ui.showVisualCue('Filters Reset');
                    return;
                }
            }

            switch(key) {
                case ' ':
                    p(); 
                    this.app.video.paused ? this.app.video.play().catch((err: any) => this.app.ui.log(err.message, true)) : this.app.video.pause(); 
                    this.app.ui.showVisualCue(this.app.video.paused ? 'Paused' : 'Play');
                    break;
                case 'arrowleft':
                    p(); this.app.video.currentTime = Math.max(0, this.app.video.currentTime - 5); this.app.ui.showVisualCue('-5s'); 
                    break;
                case 'arrowright':
                    p(); this.app.video.currentTime = Math.min(this.app.video.duration, this.app.video.currentTime + 5); this.app.ui.showVisualCue('+5s'); 
                    break;
                case 'j':
                    p(); this.app.video.currentTime = Math.max(0, this.app.video.currentTime - 10); this.app.ui.showVisualCue('-10s');
                    break;
                case 'l':
                    p(); this.app.video.currentTime = Math.min(this.app.video.duration, this.app.video.currentTime + 10); this.app.ui.showVisualCue('+10s');
                    break;
                case '[':
                    p(); this.app.video.playbackRate = Math.max(0.5, this.app.video.playbackRate - 0.5); this.app.ui.showVisualCue(`${this.app.video.playbackRate.toFixed(1)}x`);
                    break;
                case ']':
                    p(); this.app.video.playbackRate = Math.min(4.0, this.app.video.playbackRate + 0.5); this.app.ui.showVisualCue(`${this.app.video.playbackRate.toFixed(1)}x`);
                    break;
                case '0': case '1': case '2': case '3': case '4': 
                case '5': case '6': case '7': case '8': case '9':
                    p();
                    if (this.app.video.duration) {
                        const percentage = parseInt(e.key) * 10;
                        this.app.video.currentTime = (percentage / 100) * this.app.video.duration;
                        this.app.ui.showVisualCue(`${percentage}%`);
                    }
                    break;
                case 'm': 
                    p(); this.app.video.muted = !this.app.video.muted; this.app.ui.showVisualCue(this.app.video.muted ? 'Muted' : 'Unmuted');
                    break;
                case 'f': 
                    p(); 
                    if (!document.fullscreenElement) {
                        this.app.container.requestFullscreen().then(() => this.app.ui.showVisualCue('Fullscreen Mode')).catch((err: any) => this.app.ui.log(`Fullscreen rejected: ${err.message}`, true));
                    } else {
                        document.exitFullscreen().then(() => this.app.ui.showVisualCue('Exit Fullscreen')).catch((err: any) => this.app.ui.log(`Exit fullscreen rejected: ${err.message}`, true));
                    }
                    break;
                case 'z':
                    p(); this.app.subtitles.shift(-0.1);
                    break;
                case 'x':
                    p(); this.app.subtitles.shift(0.1);
                    break;
            }
        }, true);
    }
}
