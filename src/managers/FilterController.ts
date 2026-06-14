import { Filters } from '../types/index.js';

export class FilterController {
    filters: Filters = this.getDefaults();

    constructor(private video: HTMLVideoElement, private tintOverlay: HTMLElement | null, private ui: any) {}

    getDefaults(): Filters {
        return {
            gamma: 1.0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            tintColor: '#ffb000',
            tintMode: 'multiply',
            tintIntensity: 0
        };
    }

    apply() {
        if (!this.video) return;

        const exponent = 1 / this.filters.gamma;
        ['gamma-r', 'gamma-g', 'gamma-b'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.setAttribute('exponent', exponent.toString());
        });

        this.video.style.filter = `url(#video-gamma) brightness(${this.filters.brightness}%) contrast(${this.filters.contrast}%) saturate(${this.filters.saturation}%) hue-rotate(${this.filters.hue}deg)`;

        if (this.tintOverlay) {
            this.tintOverlay.style.backgroundColor = this.filters.tintColor;
            this.tintOverlay.style.mixBlendMode = this.filters.tintMode as any;
            this.tintOverlay.style.opacity = (this.filters.tintIntensity / 100).toString();
        }
    }

    reset() {
        this.filters = this.getDefaults();
        
        const controls = {
            gamma: { input: 'filter-gamma', val: 'val-gamma', default: '1.0x' },
            contrast: { input: 'filter-contrast', val: 'val-contrast', default: '100%' },
            brightness: { input: 'filter-brightness', val: 'val-brightness', default: '100%' },
            saturation: { input: 'filter-saturation', val: 'val-saturation', default: '100%' },
            hue: { input: 'filter-hue', val: 'val-hue', default: '0°' }
        };

        Object.entries(controls).forEach(([key, config]) => {
            const inputEl = document.getElementById(config.input) as HTMLInputElement;
            const valEl = document.getElementById(config.val);
            if (inputEl) inputEl.value = (this.filters as any)[key].toString();
            if (valEl) valEl.innerText = config.default;
        });

        const tintColorEl = document.getElementById('filter-tint-color') as HTMLInputElement;
        const tintModeEl = document.getElementById('filter-tint-mode') as HTMLSelectElement;
        const tintIntensityEl = document.getElementById('filter-tint-intensity') as HTMLInputElement;

        if (tintColorEl) tintColorEl.value = this.filters.tintColor;
        if (tintModeEl) tintModeEl.value = this.filters.tintMode;
        if (tintIntensityEl) tintIntensityEl.value = this.filters.tintIntensity.toString();

        const valTintColor = document.getElementById('val-tint-color');
        const valTintIntensity = document.getElementById('val-tint-intensity');
        if (valTintColor) valTintColor.innerText = this.filters.tintColor;
        if (valTintIntensity) valTintIntensity.innerText = '0%';

        this.apply();
        this.ui.log('Video filters reset to default.');
    }
}
