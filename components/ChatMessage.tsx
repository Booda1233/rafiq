import React from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  avatar: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, avatar }) => {
  const isAi = message.sender === 'ai';

  const bubbleClasses = isAi
    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-bl-none'
    : 'bg-slate-700 text-slate-100 rounded-br-none';
  
  const containerClasses = isAi ? 'justify-start' : 'justify-end';
  const avatarOrder = isAi ? 'order-first' : 'order-last';

  return (
    <div className={`flex w-full my-3 items-end gap-3 ${containerClasses}`}>
      <img src={avatar} alt="avatar" className={`w-9 h-9 rounded-full flex-shrink-0 ${avatarOrder} bg-slate-600 shadow-md`} />
      <div className={`max-w-[75%] md:max-w-[65%] px-4 py-3 rounded-2xl shadow-lg ${bubbleClasses}`}>
        {message.imageUrl && (
          <img 
            src={message.imageUrl} 
            alt="User upload" 
            className="rounded-lg mb-2 max-h-60 w-full object-cover border-2 border-white/20" 
          />
        )}
        {message.text && <p className="text-base font-medium whitespace-pre-wrap">{message.text}</p>}
      </div>
    </div>
  );
};

export default ChatMessage;