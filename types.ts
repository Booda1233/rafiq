export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  imageUrl?: string;
  base64Image?: string;
  mimeType?: string;
  fileName?: string;
  type?: 'chat' | 'trivia' | 'mission_completed' | 'generated_image' | 'source_info';
  originalPrompt?: string; // To store the prompt for generated images
  trivia?: {
    question: string;
    options: string[];
    answer: string;
    userAnswer?: string; // The option selected by the user
    isCorrect?: boolean;
  };
}

export interface UserData {
  userName: string;
  aiName: string;
  userAvatar: string;
  aiAvatar: string;
  chatBackground?: string;
  memory?: string[];
  notificationsEnabled?: boolean;
  dailyStreak?: number;
  lastInteractionDate?: string; // ISO date string
  dailyMission?: {
    text: string;
    keyword: string; // a keyword to look for in user's message
    completed: boolean;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  userData: UserData;
  lastUpdated: number;
}

// --- Periodic Background Sync API Type Definitions ---
// This extends the global ServiceWorkerRegistration interface to include
// the periodicSync property, which is part of a newer Web API not yet
// included in default TypeScript DOM typings.

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  getTags(): Promise<string[]>;
  unregister(tag: string): Promise<void>;
}

declare global {
  interface ServiceWorkerRegistration {
    readonly periodicSync: PeriodicSyncManager;
  }
}