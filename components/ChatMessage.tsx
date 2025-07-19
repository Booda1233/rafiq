
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Message } from '../types';
import TriviaCard from './TriviaCard';

interface ChatMessageProps {
  message: Message;
  avatar: string;
  onPlayAudio: (text: string, messageId: string) => void;
  isSpeaking: boolean;
  onAnswerTrivia: (messageId: string, answer: string) => void;
  onEditImage: (message: Message) => void;
}

const CodeBlock: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const codeString = String(children).replace(/\n$/, '');
  
    const handleCopy = () => {
      navigator.clipboard.writeText(codeString).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }, () => {
        // Handle copy error if needed
      });
    };
  
    return (
      <div className="code-block-wrapper bg-black/40 my-2 rounded-lg border border-[var(--border-color)] overflow-hidden font-mono text-right" dir="ltr">
        <div className="code-block-header flex justify-between items-center px-4 py-1.5 bg-[var(--bg-dark)]/50 text-xs text-[var(--text-secondary)]">
          <span>{language}</span>
          <button onClick={handleCopy} className="hover:text-white flex items-center gap-1.5 transition-colors disabled:text-slate-500 disabled:cursor-wait" disabled={isCopied}>
            {isCopied ? (
                <>
                <span className="text-[var(--success)]">Copied!</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </>
            ) : (
                <>
                <span>Copy code</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </>
            )}
          </button>
        </div>
        <pre className="p-4 text-sm overflow-x-auto bg-transparent"><code className={className}>{children}</code></pre>
      </div>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, avatar, onPlayAudio, isSpeaking, onAnswerTrivia, onEditImage }) => {
  const isAi = message.sender === 'ai';

  const bubbleClasses = isAi
    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] rounded-br-lg border border-[var(--border-color)]'
    : 'bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] text-slate-900 rounded-bl-lg';
  
  const containerClasses = isAi ? 'justify-start' : 'justify-end';
  const avatarOrder = isAi ? 'order-first' : 'order-last';
  
  const imageSrc = message.base64Image ? `data:${message.mimeType};base64,${message.base64Image}` : message.imageUrl;
  const isImageFile = message.mimeType?.startsWith('image/');


  if (message.type === 'mission_completed') {
    return (
        <div className="text-center my-4 text-[var(--success)] font-semibold animate-in zoom-in-95 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{message.text}</span>
        </div>
    )
  }

  if (message.type === 'source_info') {
    const textWithIcon = message.text.replace(
        '**المصادر:**', 
        `**<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline -mt-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg> المصادر:**`
    );

    return (
        <div className="flex w-full my-2 justify-start animate-message-in">
            {/* Spacer to align with messages that have an avatar */}
            <div className="w-9 h-9 flex-shrink-0 mr-3"></div>
            <div className="max-w-[85%] sm:max-w-[80%] w-full">
                <div className="p-3 rounded-lg bg-[var(--bg-dark)]/40 border border-[var(--border-color)]">
                    <div className="markdown-container text-sm text-[var(--text-secondary)]" dir="auto">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                p: ({node, ...props}) => <p className="mb-1" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-white/90 flex items-center gap-2 mb-2 text-base" {...props} />,
                                a: ({node, ...props}) => <a className="text-[var(--primary-from)] hover:underline hover:text-[var(--primary-to)] transition-colors break-all" target="_blank" rel="noopener noreferrer" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1.5" {...props} />,
                                li: ({node, ...props}) => <li className="truncate" {...props} />,
                            }}
                        >
                            {textWithIcon}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={`flex w-full my-3 items-end gap-3 ${containerClasses} animate-message-in`}>
      <img src={avatar} alt="avatar" className={`w-9 h-9 rounded-full flex-shrink-0 ${avatarOrder} bg-[var(--bg-surface)] shadow-md self-end`} />
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[80%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-full px-4 py-3 rounded-t-2xl shadow-lg ${bubbleClasses}`}>
          
          {isImageFile && imageSrc && (
            <div className="relative group/image-editor">
              <img 
                src={imageSrc} 
                alt={message.fileName || (isAi ? "صورة من صديقك" : "صورة أرسلها المستخدم")}
                className="rounded-lg mb-2 max-h-72 w-full object-cover border-2 border-white/10" 
              />
              {message.type === 'generated_image' && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover/image-editor:opacity-100 transition-opacity duration-300">
                    <button 
                        onClick={() => onEditImage(message)}
                        className="flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white font-bold py-2 px-4 rounded-full hover:bg-black/60 transition-all transform hover:scale-105"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        <span>تعديل</span>
                    </button>
                </div>
              )}
            </div>
          )}

          {!isImageFile && message.fileName && (
              <div className={`mt-2 mb-1 p-3 rounded-lg flex items-center gap-3 ${isAi ? 'bg-black/10' : 'bg-white/10'}`}>
                <div className="flex-shrink-0 text-white/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <p className={`font-semibold truncate ${!isAi ? 'text-slate-900' : 'text-white'}`}>{message.fileName}</p>
                  <p className={`text-xs ${!isAi ? 'text-slate-900/70' : 'text-white/70'}`}>{message.mimeType}</p>
                </div>
              </div>
          )}

          {message.type === 'trivia' && message.trivia ? (
             <TriviaCard 
                messageId={message.id}
                trivia={message.trivia}
                onAnswer={onAnswerTrivia}
                isAiBubble={isAi}
             />
          ) : message.text && (
            <div className={`markdown-container text-base whitespace-pre-wrap ${isAi ? 'font-medium' : 'font-semibold'}`} dir="auto">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        p: ({node, ...props}) => <p className="my-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside my-2" {...props} />,
                        code({node, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!match) { // It's inline code
                                return <code className={`font-mono text-sm px-1.5 py-0.5 rounded-md ${isAi ? 'bg-black/20 text-[var(--primary-to)]' : 'bg-black/20 text-white'}`} {...props}>{children}</code>
                            }
                            // It's a code block
                            return <CodeBlock className={className}>{children}</CodeBlock>;
                        }
                    }}
                >
                    {message.text}
                </ReactMarkdown>
            </div>
          )}
        </div>
        {isAi && message.text && (
            <button
                onClick={() => onPlayAudio(message.text, message.id)}
                className="text-[var(--text-secondary)] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[var(--bg-surface-hover)] self-center flex-shrink-0"
                aria-label={isSpeaking ? "إيقاف الصوت" : "تشغيل الصوت"}
            >
                {isSpeaking ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <defs><linearGradient id="speak-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--primary-from)"/><stop offset="100%" stopColor="var(--primary-to)"/></linearGradient></defs>
                        <path fill="url(#speak-gradient)" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zM12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path fill="url(#speak-gradient)" d="M13 8h-2v8h2V8zM9 11h2v2H9zM15 11h2v2h-2z"></path>
                     </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                )}
            </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
