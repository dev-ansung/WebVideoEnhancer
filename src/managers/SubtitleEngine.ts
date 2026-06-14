import { SubtitleCue, SubSettings } from '../types/index.js';
import { formatTime, formatTimeMs, srtTimeToSeconds } from '../utils/time.js';

export class SubtitleEngine {
    subtitles: [SubtitleCue[], SubtitleCue[]] = [[], []];
    nativeTrack: [TextTrack | null, TextTrack | null] = [null, null];
    subSettings: [SubSettings, SubSettings] = [
        { pos: 0,  size: 16, color: '#ffffff' },
        { pos: 15, size: 16, color: '#ffffff' }
    ];
    captionShift = 0;
    private transcriptBoxes: [HTMLElement, HTMLElement];

    constructor(private video: HTMLVideoElement, private ui: any) {
        this.transcriptBoxes = [
            document.getElementById('transcript-box-1')!,
            document.getElementById('transcript-box-2')!
        ];
    }

    processSRT(data: string, trackIdx: number) {
        const blocks = data.replace(/\r\n/g, '\n').trim().split('\n\n');
        this.subtitles[trackIdx] = [];
        
        blocks.forEach((block, index) => {
            const lines = block.split('\n');
            if(lines.length >= 3) {
                const timeLine = lines[1];
                const text = lines.slice(2).join('\n');
                const match = timeLine.match(/(\d+:\d+:\d+,\d+)\s*-->\s*(\d+:\d+:\d+,\d+)/);
                
                if(match) {
                    this.subtitles[trackIdx].push({
                        id: `cue-${index}`,
                        start: srtTimeToSeconds(match[1]),
                        end: srtTimeToSeconds(match[2]),
                        text: text
                    });
                }
            }
        });

        this.captionShift = 0;
        this.updateSyncUI();
        this.renderNativeTrack(trackIdx);
        this.buildTranscript(trackIdx);
    }

    renderNativeTrack(trackIdx: number) {
        if (this.subtitles[trackIdx].length === 0) return;

        const settings = this.subSettings[trackIdx];
        let textTrack = this.nativeTrack[trackIdx];

        if (!textTrack) {
            textTrack = this.video.addTextTrack(
                'subtitles',
                `Custom Track ${trackIdx + 1}`,
                trackIdx === 0 ? 'en' : 'es'
            );
            textTrack.mode = 'showing';
            this.nativeTrack[trackIdx] = textTrack;
        } else {
            Array.from(textTrack.cues || []).forEach(c => textTrack!.removeCue(c));
        }

        this.subtitles[trackIdx].forEach(cue => {
            try {
                const start = cue.start + this.captionShift;
                const end   = cue.end   + this.captionShift;
                const vttCue = new VTTCue(Math.max(0, start), Math.max(0.001, end), cue.text);
                vttCue.id = String(cue.id);
                vttCue.snapToLines = false;
                vttCue.line = 100 - settings.pos;
                vttCue.align = 'center';
                textTrack!.addCue(vttCue);
            } catch (e) {}
        });

        textTrack.oncuechange = () => this.handleNativeCueChange(textTrack!, trackIdx);
    }

    private handleNativeCueChange(trackObj: TextTrack, trackIdx: number) {
        const activeCues = trackObj.activeCues;
        if (activeCues && activeCues.length > 0) {
            this.highlightTranscript(activeCues[0].id, trackIdx);
        } else {
            this.highlightTranscript(null, trackIdx);
        }
    }

    buildTranscript(trackIdx: number) {
        const tBox = this.transcriptBoxes[trackIdx];
        tBox.innerHTML = '';
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
            const li = document.createElement('div');
            li.className = 'transcript-item p-3 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/80 flex gap-3 border-l-4 border-l-transparent text-gray-300';
            li.id = `transcript-${trackIdx}-${cue.id}`;
            
            const rawText = cue.text.replace(/<br>/g, ' ').replace(/<[^>]+>/g, '');
            const displayTime = Math.max(0, cue.start + this.captionShift);
            
            li.innerHTML = `<span class="text-purple-400 font-mono shrink-0 text-xs mt-0.5">[${formatTimeMs(displayTime)}]</span> <span>${rawText}</span>`;
            
            li.addEventListener('click', () => {
                this.video.currentTime = Math.max(0, cue.start + this.captionShift); 
                if (this.video.paused) {
                    this.video.play().catch(e => this.ui.log(`Play error: ${(e as Error).message}`, true));
                }
                this.ui.log(`Seek to transcript ${trackIdx + 1}: ${formatTime(displayTime)}`);
            });

            tBox.appendChild(li);
        });
    }

    highlightTranscript(cueId: string | null, trackIdx: number) {
        const tBox = this.transcriptBoxes[trackIdx];
        const old = tBox.querySelector('.transcript-item.active');
        if (old) old.classList.remove('active');
        
        if (cueId) {
            const current = document.getElementById(`transcript-${trackIdx}-${cueId}`);
            if (current) current.classList.add('active');
        }
    }

    updateSyncUI() {
        const ms = Math.round(this.captionShift * 1000);
        const sign = ms > 0 ? '+' : '';
        this.ui.showVisualCue(`Sync: ${sign}${ms}ms`);
        document.getElementById('tel-sync')!.innerText = `${sign}${ms} ms`;
        if (ms % 500 === 0) this.ui.log(`Caption sync shifted to ${sign}${ms}ms`);
    }

    shift(delta: number) {
        this.captionShift += delta;
        this.updateSyncUI();
        this.renderNativeTrack(0);
        this.renderNativeTrack(1);
        this.buildTranscript(0);
        this.buildTranscript(1);
    }
}
