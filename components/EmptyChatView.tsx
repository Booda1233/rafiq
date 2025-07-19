
import React from 'react';
import SmartFriendIcon from './SmartFriendIcon';

interface EmptyChatViewProps {
  onSendMessage: (text: string) => void;
}

const StarterPrompt: React.FC<{ text: string; icon: React.ReactNode; onClick: () => void }> = ({ text, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-[var(--bg-surface)]/70 border border-[var(--border-color)] p-4 rounded-2xl text-right text-[var(--text-main)] transition-all duration-300 hover:bg-[var(--bg-surface-hover)] hover:border-[var(--primary-from)]/50 cursor-pointer hover:scale-105 group hover:shadow-lg hover:shadow-[var(--primary-from)]/10"
    >
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary-from)]/10 to-[var(--primary-to)]/10 text-[var(--primary-from)] group-hover:text-white transition-colors duration-300">
                {icon}
            </div>
            <p className="font-semibold">{text}</p>
        </div>
    </button>
);

const EmptyChatView: React.FC<EmptyChatViewProps> = ({ onSendMessage }) => {
  const prompts = [
    { text: "اشرح لي مفهوم الحوسبة الكمومية ببساطة", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.96.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg> },
    { text: "لنبدأ قصة تفاعلية", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0014.5 16c1.255 0 2.443-.29 3.5-.804v-10A7.968 7.968 0 0014.5 4z" /></svg> },
    { text: "اكتب لي قصيدة عن جمال النجوم", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> },
    { text: "ساعدني في كتابة بريد إلكتروني احترافي", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg> },
  ];

  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center p-4 animate-in zoom-in-95 duration-500">
      <div className="relative mb-4">
        <div className="absolute -inset-4 bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] rounded-full blur-3xl opacity-20 animate-pulse-glow"></div>
        <SmartFriendIcon className="w-28 h-28 relative z-10 drop-shadow-[0_0_25px_rgba(0,169,255,0.4)]" />
      </div>
      <h2 className="text-3xl font-extrabold text-[var(--text-main)] mb-2">
        مرحباً! أنا صديقك الذكي.
      </h2>
      <p className="text-[var(--text-secondary)] max-w-sm text-lg">
        كيف يمكنني أن أدهشك اليوم؟ ابدأ محادثة أو اختر أحد الاقتراحات.
      </p>
      <div className="mt-12 w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((prompt, index) => (
            <StarterPrompt key={index} text={prompt.text} icon={prompt.icon} onClick={() => onSendMessage(prompt.text)} />
        ))}
      </div>
    </div>
  );
};

export default EmptyChatView;
