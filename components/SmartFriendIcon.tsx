import React from 'react';

const SmartFriendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <defs>
      <linearGradient id="smart-friend-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--primary-from)" />
        <stop offset="100%" stopColor="var(--primary-to)" />
      </linearGradient>
    </defs>
    {/* Larger back chat bubble */}
    <path 
        stroke="url(#smart-friend-gradient)"
        opacity="0.6"
        d="M17.5 13.5c0 3.31-2.69 6-6 6h-3a1 1 0 0 1-1-1v-4c0-3.31 2.69-6 6-6h1c3.31 0 6 2.69 6 6v1z" 
    />
    {/* Smaller front chat bubble */}
    <path 
        stroke="url(#smart-friend-gradient)"
        d="M6.5 10.5c0-3.31 2.69-6 6-6h3a1 1 0 0 1 1 1v4c0 3.31-2.69 6-6 6h-1c-3.31 0-6-2.69-6-6v-1z" 
    />
  </svg>
);

export default SmartFriendIcon;
