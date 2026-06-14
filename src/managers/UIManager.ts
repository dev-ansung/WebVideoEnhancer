export class UIManager {
    private logBox: HTMLElement;
    private visualCue: HTMLElement;
    private cueTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private app: any) {
        this.logBox = document.getElementById('action-log')!;
        this.visualCue = document.getElementById('visual-cue')!;

        document.getElementById('clear-log')?.addEventListener('click', () => {
            this.logBox.innerHTML = '';
        });
    }

    log(msg: string, isError: boolean = false) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'});
        const div = document.createElement('div');
        div.className = isError ? 'text-red-400' : 'text-green-400';
        div.innerText = `[${time}] ${msg}`;
        this.logBox.appendChild(div);
        this.logBox.scrollTop = this.logBox.scrollHeight;
    }

    showVisualCue(text: string) {
        this.visualCue.innerText = text;
        this.visualCue.style.opacity = '1';
        if (this.cueTimer) clearTimeout(this.cueTimer);
        this.cueTimer = setTimeout(() => { this.visualCue.style.opacity = '0'; }, 1500);
    }
}
