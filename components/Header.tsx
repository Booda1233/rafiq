
import React from 'react';
import FlameIcon from './FlameIcon';

interface HeaderProps {
  aiName: string;
  aiAvatar: string;
  dailyStreak: number;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ aiName, dailyStreak, onOpenSettings, onToggleSidebar }) => {
  return (
    <header className="bg-transparent px-2 sm:px-4 py-3 flex items-center justify-between z-20 flex-shrink-0">
      {/* Menu Button */}
      <div className="flex-1 flex justify-start">
        <button 
          onClick={onToggleSidebar} 
          className="text-[var(--text-secondary)] hover:text-white transition-colors p-2 rounded-full hover:bg-[var(--bg-surface-hover)]"
          aria-label="قائمة المحادثات"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </button>
      </div>

      {/* Centered User Info */}
      <div className="flex-grow flex flex-col items-center justify-center text-center overflow-hidden">
        <h1 className="text-lg font-bold text-white truncate">{aiName}</h1>
        <div className="flex items-center gap-1.5 text-xs text-[var(--success)]">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
            </span>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex-1 flex justify-end items-center gap-2">
        {dailyStreak > 0 && (
            <div className="flex items-center gap-1 bg-[var(--bg-surface)] text-cyan-300 rounded-full px-3 py-1 text-sm font-bold animate-in zoom-in-95 border border-transparent" title={`${dailyStreak} أيام من الحماس المتواصل!`}>
                <FlameIcon className="w-4 h-4" />
                <span className="bg-gradient-to-br from-[var(--primary-to)] to-[var(--primary-from)] bg-clip-text text-transparent font-bold">{dailyStreak}</span>
            </div>
        )}
        <button 
          onClick={onOpenSettings} 
          className="text-[var(--text-secondary)] hover:text-white transition-colors p-2 rounded-full hover:bg-[var(--bg-surface-hover)]"
          aria-label="الإعدادات"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
