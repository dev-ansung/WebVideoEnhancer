export interface SubtitleCue {
    id: string;
    start: number;
    end: number;
    text: string;
}

export interface SubSettings {
    pos: number;
    size: number;
    color: string;
}

export interface Filters {
    gamma: number;
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    tintColor: string;
    tintMode: string;
    tintIntensity: number;
}
