
import React from 'react';

const FlameIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="url(#flame-gradient)" 
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: 'var(--primary-from)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--primary-to)' }} />
      </linearGradient>
    </defs>
    <path 
      fillRule="evenodd" 
      d="M12.963 2.286a.75.75 0 00-1.071 1.071 9.75 9.75 0 01-1.742 4.566c-.749 1.584.234 3.371.97 3.967.333.272.682.498 1.03.662.348.164.706.266 1.074.266 1.356 0 2.456-1.1 2.456-2.456 0-1.152-.78-2.123-1.819-2.374a.75.75 0 10-.531 1.424 1.002 1.002 0 01.077 1.953c.248.062.468.12.68.198.213.079.428.16.64.245.65.248 1.125.688 1.125 1.266 0 .975-.935 1.688-1.926 1.688-.534 0-1.023-.21-1.383-.564a2.474 2.474 0 01-.823-1.423.75.75 0 00-1.423-.434 4.004 4.004 0 00-1.923 3.434c0 1.699 1.018 3.162 2.498 3.734a4.5 4.5 0 005.272-1.536c.986-1.395 1.443-3.218.996-5.027a18.25 18.25 0 00-2.652-5.786.75.75 0 00-1.071-1.071z" 
      clipRule="evenodd" 
    />
  </svg>
);

export default FlameIcon;