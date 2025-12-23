
export type VideoResolution = '2K' | '4K';
export type AspectRatio = '9:16' | '16:9' | '1:1';

export interface VideoFile {
  id: string;
  file: File;
  previewUrl: string;
  duration: number;
  energyLevel: 'low' | 'medium' | 'high';
}

export interface EditProject {
  title: string;
  resolution: VideoResolution;
  targetDuration: number; // in seconds
  aspectRatio: AspectRatio;
  musicalFocus: 'vocals' | 'guitar-solos' | 'drums' | 'crowd-energy';
  logo: File | null;
  logoPreviewUrl: string | null;
}

export interface EditPlan {
  scenes: {
    clipId: string;
    startTime: number;
    duration: number;
    transition: string;
    description: string;
  }[];
  soundtrackEnhancement: string;
}
