export enum Sender {
  User = 'user',
  AI = 'ai',
  System = 'system',
}

export enum AIGender {
    Male = 'ذكر',
    Female = 'أنثى',
}

export enum Mood {
    Happy = 'سعيد',
    Okay = 'عادي',
    Sad = 'حزين',
    Excited = 'متحمس',
    Tired = 'متعب'
}

export enum AchievementID {
    FIRST_ONBOARDING = 'FIRST_ONBOARDING',
    FIRST_MISSION = 'FIRST_MISSION',
    STREAK_3_DAYS = 'STREAK_3_DAYS',
    IMAGE_CREATOR = 'IMAGE_CREATOR',
    MEMORY_MAKER = 'MEMORY_MAKER',
    TRIVIA_MASTER = 'TRIVIA_MASTER',
    CHATTY_USER = 'CHATTY_USER', // For sending 50 messages
}

export interface Achievement {
    id: AchievementID;
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
  imageUrl?: string;
  imageToProcess?: string;
  trivia?: TriviaQuestion;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface UserSettings {
  userName: string;
  aiName: string;
  aiGender: AIGender;
  notificationsEnabled: boolean;
  unlockedAchievements: AchievementID[];
}

export interface DailyStatus {
    date: string; // YYYY-MM-DD
    mood: Mood | null;
    missionCompleted: boolean;
}

export interface Memory {
  id: string;
  content: string;
  createdAt: number;
}