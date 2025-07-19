
import React from 'react';

interface DailyMissionBannerProps {
  missionText: string;
}

const DailyMissionBanner: React.FC<DailyMissionBannerProps> = ({ missionText }) => {
  return (
    <div className="bg-gradient-to-r from-[var(--primary-from)]/10 via-[var(--bg-surface)]/10 to-transparent p-3 sm:p-4 border-t border-[var(--border-color)] animate-in fade-in duration-500">
        <div className="flex items-center justify-center text-center gap-3">
            <span className="text-[var(--primary-from)] shrink-0 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
            </span>
            <div className="text-sm">
                <p className="font-bold text-white">مهمة اليوم</p>
                <p className="text-[var(--text-secondary)]">{missionText}</p>
            </div>
        </div>
    </div>
  );
};

export default DailyMissionBanner;