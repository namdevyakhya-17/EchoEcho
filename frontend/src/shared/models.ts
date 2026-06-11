export interface Inspiration {
  mood: string;
  genre: string;
  theme: string;
  instrument: string;
  style: string;
  bpm: number;
  tempoFeel: string;
  promptText: string;
}

export interface Track {
  id: string;
  name: string;
  mood: string;
  genre: string;
  bpm: number;
  dur: string;
  date: string;
  color: string;
  emoji?: string;
  fav: boolean;
}

export interface AuthUser {
  token: string;
  name: string;
  email: string;
}

