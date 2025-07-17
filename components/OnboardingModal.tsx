
import React, { useState } from 'react';
import { UserSettings, AIGender } from '../types';

interface OnboardingModalProps {
  onComplete: (settings: Pick<UserSettings, 'userName' | 'aiName' | 'aiGender'>) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [userName, setUserName] = useState('');
  const [aiName, setAiName] = useState('');
  const [aiGender, setAiGender] = useState<AIGender>(AIGender.Male); // Default to Male

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && aiName.trim()) {
      onComplete({
        userName,
        aiName,
        aiGender,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--background)] bg-opacity-90 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-[var(--surface-1)] rounded-2xl shadow-2xl w-full max-w-md text-center p-8 border border-[var(--border)]">
        <h1 className="text-3xl font-bold mb-2 text-[var(--accent)]">مرحباً بك في عالمك الخاص!</h1>
        <p className="text-[var(--text-secondary)] mb-8">لنصنع معًا رفيقك الافتراضي الأول.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-md font-medium text-[var(--text-secondary)] mb-2 text-right">ما هو اسمك الذي أناديك به؟</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[var(--surface-2)] border-2 border-[var(--border)] rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              placeholder="اكتب اسمك هنا"
              required
            />
          </div>
          <div>
            <label htmlFor="aiName" className="block text-md font-medium text-[var(--text-secondary)] mb-2 text-right">ما الاسم الذي ستطلقه على رفيقك؟</label>
            <input
              id="aiName"
              type="text"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              className="w-full bg-[var(--surface-2)] border-2 border-[var(--border)] rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              placeholder="اكتب اسم الرفيق هنا"
              required
            />
          </div>

          {/* AI Gender Selection */}
          <div>
            <label className="block text-md font-medium text-[var(--text-secondary)] mb-3 text-right">اختر هوية رفيقك</label>
            <div className="grid grid-cols-2 gap-4">
              {(Object.values(AIGender)).map((gender) => (
                <div key={gender}>
                  <input
                    type="radio"
                    id={`gender-${gender}`}
                    name="aiGender"
                    value={gender}
                    checked={aiGender === gender}
                    onChange={() => setAiGender(gender)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`gender-${gender}`}
                    className={`block w-full text-center p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                      aiGender === gender
                        ? 'bg-[var(--accent)] border-[var(--accent-hover)] text-slate-900 font-bold'
                        : 'bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--border)]'
                    }`}
                  >
                    {gender}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-slate-900 font-bold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105">
            لنبدأ المغامرة!
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingModal;
