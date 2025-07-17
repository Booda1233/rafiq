
import React from 'react';
import { LogoIcon } from './icons';

const SplashScreen: React.FC = () => {
    return (
        <div className="splash-screen">
            <div className="splash-content flex flex-col items-center gap-4">
                <LogoIcon className="w-24 h-24 text-[var(--accent)] splash-icon" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Rafiq</h1>
                <p className="text-[var(--text-secondary)]">...جاري تحضير عالمك الخاص</p>
            </div>
        </div>
    );
};

export default SplashScreen;
