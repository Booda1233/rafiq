
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-start my-3 gap-3 animate-message-in">
        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[var(--bg-surface)] shadow-md"></div>
        <div className="flex items-center justify-center space-x-1.5 p-4 bg-[var(--bg-surface)] rounded-t-2xl rounded-br-lg shadow-lg border border-[var(--border-color)]">
           <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse [animation-delay:-0.4s]"></div>
           <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse [animation-delay:-0.2s]"></div>
           <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse"></div>
        </div>
    </div>
  );
};

export default TypingIndicator;
