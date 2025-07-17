
import { Achievement, AchievementID } from './types';
import { TargetIcon, FireIcon, ImageIcon, CheckCircleIcon, TrophyIcon } from './components/icons';

export const ALL_ACHIEVEMENTS: Achievement[] = [
    {
        id: AchievementID.FIRST_ONBOARDING,
        title: "رفيق جديد",
        description: "أكملت الإعداد الأولي وأنشأت رفيقك الأول.",
        icon: TrophyIcon,
    },
    {
        id: AchievementID.FIRST_MISSION,
        title: "مبادر",
        description: "أكملت أول مهمة يومية بنجاح.",
        icon: TargetIcon,
    },
    {
        id: AchievementID.STREAK_3_DAYS,
        title: "شعلة لا تنطفئ",
        description: "حافظت على سلسلة حماس لمدة 3 أيام متتالية.",
        icon: FireIcon,
    },
    {
        id: AchievementID.IMAGE_CREATOR,
        title: "فنان مبدع",
        description: "أنشأت أول صورة لك باستخدام الذكاء الاصطناعي.",
        icon: ImageIcon,
    },
    {
        id: AchievementID.MEMORY_MAKER,
        title: "صانع الذكريات",
        description: "حفظت أول ذكرى مهمة لرفيقك.",
        icon: CheckCircleIcon,
    },
    {
        id: AchievementID.TRIVIA_MASTER,
        title: "ملك المعلومات",
        description: "فزت في أول لعبة أسئلة.",
        icon: TrophyIcon,
    },
    {
        id: AchievementID.CHATTY_USER,
        title: "رفيق مقرب",
        description: "أرسلت 50 رسالة في محادثة واحدة.",
        icon: FireIcon,
    },
];
