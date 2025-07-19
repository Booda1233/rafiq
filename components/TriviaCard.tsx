
import React from 'react';
import type { Message } from '../types';

interface TriviaCardProps {
    messageId: string;
    trivia: NonNullable<Message['trivia']>;
    onAnswer: (messageId: string, answer: string) => void;
    isAiBubble: boolean;
}

const TriviaCard: React.FC<TriviaCardProps> = ({ messageId, trivia, onAnswer, isAiBubble }) => {
    const { question, options, userAnswer, answer, isCorrect } = trivia;
    const hasAnswered = userAnswer !== undefined;

    const getButtonClass = (option: string) => {
        const baseClass = isAiBubble ? 'bg-black/10 hover:bg-black/20 border-white/20 hover:border-white/40' : 'bg-white/10 hover:bg-white/20 border-white/30 hover:border-white/50';
        
        if (!hasAnswered) {
            return baseClass;
        }
        
        const answeredBase = isAiBubble ? 'border-transparent opacity-60 cursor-not-allowed' : 'border-transparent opacity-60 cursor-not-allowed'

        if (option === answer) {
            return `bg-[var(--success)]/30 text-white ${answeredBase}`;
        }
        if (option === userAnswer && !isCorrect) {
            return `bg-[var(--danger)]/30 text-white ${answeredBase}`;
        }
        return `bg-transparent ${answeredBase}`;
    };

    const textColor = isAiBubble ? 'text-white' : 'text-slate-900';

    return (
        <div className={`space-y-4 ${textColor}`}>
            <p className="font-bold text-lg text-center">{question}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onAnswer(messageId, option)}
                        disabled={hasAnswered}
                        className={`w-full text-right p-3 rounded-lg transition-all duration-200 font-semibold text-base border ${getButtonClass(option)} ${textColor}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {hasAnswered && (
                <div className={`mt-3 text-center font-bold text-lg animate-in fade-in ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {isCorrect ? 'إجابة رائعة!' : `للأسف، الإجابة الصحيحة هي: ${answer}`}
                </div>
            )}
        </div>
    );
};

export default TriviaCard;
