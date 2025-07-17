
// --- Web Speech API Type Definitions ---
// This is necessary because these APIs are not yet part of standard TypeScript DOM typings.
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onerror: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index:number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index:number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

// Type for the constructor
interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Message, Sender, ChatSession, UserSettings, TriviaQuestion, Memory, DailyStatus, Mood, AchievementID } from '../types';
import { SendIcon, MicIcon, ImageIcon, UserAvatar, PlayIcon, FireIcon, SettingsIcon, CopyIcon, CheckIcon, LogoIcon, CloseIcon, MenuIcon, PlusIcon, TrashIcon, TargetIcon, CheckCircleIcon, MoodHappyIcon, MoodOkayIcon, MoodSadIcon, LightBulbIcon, TrophyIcon } from './icons';
import { getChatResponse, generateImage, extractMemory, generateTriviaQuestion } from '../services/gemini';

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-[var(--surface-1)] rounded-lg my-2 relative text-sm text-left border border-[var(--border)]" dir="ltr">
            <div className="p-2 flex justify-end border-b border-[var(--border)]">
                <button 
                    onClick={handleCopy} 
                    className="flex items-center gap-1.5 text-xs bg-[var(--surface-2)] hover:bg-[var(--border)] px-2 py-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                    {copied ? 'تم النسخ' : 'نسخ'}
                </button>
            </div>
            <pre className="p-4 pt-2 overflow-x-auto scroll-container">
                <code className="font-mono">{code}</code>
            </pre>
        </div>
    );
};

const isPredominantlyRTL = (text: string): boolean => {
  const rtlChars = /[\u0600-\u06FF]/;
  return rtlChars.test(text);
};


const MessageBubble: React.FC<{ msg: Message; settings: UserSettings; onPlayAudio: (text: string) => void; onTriviaAnswer: (answer: string) => void }> = ({ msg, settings, onPlayAudio, onTriviaAnswer }) => {
    const isUser = msg.sender === Sender.User;
    
    const renderTextWithCodeBlocks = (text: string) => {
        const codeBlockRegex = /(```(?:[a-zA-Z-]*\n)?[\s\S]*?```)/g;
        const parts = text.split(codeBlockRegex);

        return (
            <>
                {parts.map((part, index) => {
                    if (part.startsWith('```') && part.endsWith('```')) {
                        const codeContentMatch = part.match(/```(?:[a-zA-Z-]*\n)?([\s\S]*?)```/);
                        const code = codeContentMatch ? codeContentMatch[1].trim() : '';
                        return <CodeBlock key={`code-${index}`} code={code} />;
                    } else {
                        if (!part.trim()) return null;
                        return (
                            <div key={`text-${index}`}>
                                {part.split('\n').map((line, lineIndex) => {
                                    if (line.trim() === '') return null;
                                    const dir = isPredominantlyRTL(line) ? 'rtl' : 'ltr';
                                    return (
                                        <p key={lineIndex} dir={dir} className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                                            {line}
                                        </p>
                                    );
                                })}
                            </div>
                        );
                    }
                })}
            </>
        );
    };
    
    const renderContent = () => {
        if (msg.imageToProcess) {
            return (
                 <div>
                    {msg.text && <p className="mb-2">{msg.text}</p>}
                    <img src={msg.imageToProcess} alt="User Upload" className="rounded-lg max-w-xs" />
                </div>
            )
        }
        if (msg.imageUrl) {
            return (
                <div>
                    {msg.text && <p className="mb-2">{msg.text}</p>}
                    <img src={msg.imageUrl} alt="Generated" className="rounded-lg max-w-xs" />
                </div>
            );
        }
        if (msg.trivia) {
            return (
                <div>
                    <p className="mb-3 font-semibold">{msg.trivia.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {msg.trivia.options.map((option, index) => (
                            <button key={index} onClick={() => onTriviaAnswer(option)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-slate-900 font-bold rounded-md p-2 text-sm transition-colors">
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        return <div>{renderTextWithCodeBlocks(msg.text)}</div>;
    };

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} message-enter message-enter-active`}>
            {!isUser && <div className="w-8 h-8 rounded-full bg-[var(--surface-1)] self-start flex-shrink-0 flex items-center justify-center border border-[var(--border)]"><LogoIcon className="w-5 h-5 text-[var(--accent)]"/></div>}
            
            <div className={`max-w-md lg:max-w-2xl rounded-xl px-4 py-2.5 shadow-md ${isUser ? 'bg-[var(--accent)] text-slate-900 font-semibold' : 'bg-[var(--surface-1)]'}`}>
                 {renderContent()}
            </div>
            
            {isUser ? (
                 <UserAvatar name={settings.userName} className="w-8 h-8 flex-shrink-0"/>
            ) : (
                msg.text && !msg.trivia && (
                     <button onClick={() => onPlayAudio(msg.text.replace(/```[\s\S]*?```/g, 'تم عرض الكود'))} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex-shrink-0 self-center">
                        <PlayIcon className="w-5 h-5" />
                    </button>
                )
            )}
        </div>
    );
};

const DailyCheckin: React.FC<{
    onSetMood: (mood: Mood) => void;
    dailyMission: { text: string; completed: boolean };
    onMissionClick: (mission: string) => void;
}> = ({ onSetMood, dailyMission, onMissionClick }) => {
    const moods = [
        { mood: Mood.Happy, icon: MoodHappyIcon, color: "text-green-400" },
        { mood: Mood.Okay, icon: MoodOkayIcon, color: "text-yellow-400" },
        { mood: Mood.Sad, icon: MoodSadIcon, color: "text-blue-400" },
    ];

    return (
        <div className="space-y-6">
            <div className="p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-center">
                 <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">كيف تشعر اليوم؟</h3>
                 <div className="flex justify-center gap-4">
                     {moods.map(({ mood, icon: Icon, color }) => (
                         <button key={mood} onClick={() => onSetMood(mood)} className={`p-3 rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)] transition-transform transform hover:scale-110`}>
                             <Icon className={`w-8 h-8 ${color}`} />
                         </button>
                     ))}
                 </div>
            </div>
            <div className="p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                    <TargetIcon className="w-6 h-6 text-[var(--accent)]" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">المهمة اليومية</h3>
                </div>
                {dailyMission.completed ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircleIcon className="w-6 h-6"/>
                        <p className="font-semibold">رائع، لقد أتممت مهمة اليوم!</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="mb-3 text-[var(--text-secondary)]">{dailyMission.text}</p>
                        <button onClick={() => onMissionClick(dailyMission.text)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-slate-900 font-bold py-2 px-4 rounded-md transition-colors">
                            إنجاز المهمة
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const SuggestionCard: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  example: string;
  onClick: () => void;
}> = ({ icon: Icon, title, example, onClick }) => (
  <button
    onClick={onClick}
    className="group bg-[var(--surface-1)] hover:bg-[var(--surface-2)] p-4 rounded-lg transition-all duration-200 text-right border border-[var(--border)] transform hover:-translate-y-1"
  >
    <div className="flex items-start gap-4">
      <Icon className="w-8 h-8 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
      <div>
        <p className="font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="text-sm text-[var(--text-secondary)]">{example}</p>
      </div>
    </div>
  </button>
);

const WelcomeScreen: React.FC<{ aiName: string; onSuggestionClick: (suggestion: string) => void; }> = ({ aiName, onSuggestionClick }) => (
    <div className="flex flex-col items-center justify-center text-[var(--text-secondary)] p-4 text-center animate-fade-in-up">
       <LogoIcon className="w-24 h-24 mb-4 text-[var(--accent)]" />
       <h2 className="text-4xl font-bold mb-2 text-[var(--text-primary)]">مرحباً بك مجدداً</h2>
       <p className="mb-10 text-lg">أنا {aiName}، رفيقك. كيف يمكنني أن أجعل يومك أفضل؟</p>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
         <SuggestionCard 
            icon={LightBulbIcon}
            title="اقترح فكرة"
            example="لخطة عشاء الليلة"
            onClick={() => onSuggestionClick("اقترح علي فكرة لعشاء الليلة يكون صحي وسريع.")}
         />
         <SuggestionCard 
            icon={ImageIcon}
            title="اطلب تصميمًا"
            example="ارسم لي رائد فضاء على حصان في المريخ"
            onClick={() => onSuggestionClick("ارسم لي رائد فضاء يركب حصانًا على سطح المريخ.")}
         />
          <SuggestionCard 
            icon={TrophyIcon}
            title="ابدأ لعبة"
            example="لعبة أسئلة عن عواصم العالم"
            onClick={() => onSuggestionClick("يلا نلعب لعبة أسئلة عن عواصم العالم.")}
         />
         <SuggestionCard 
            icon={CopyIcon}
            title="اكتب لي شيئًا"
            example="قصيدة قصيرة عن جمال السماء"
            onClick={() => onSuggestionClick("اكتب لي قصيدة قصيرة عن جمال السماء في الليل.")}
         />
       </div>
    </div>
);


interface ChatScreenProps {
    settings: UserSettings;
    sessions: ChatSession[];
    activeSession: ChatSession | null;
    memories: Memory[];
    dailyStreak: number;
    dailyStatus: DailyStatus;
    onSetDailyStatus: (statusUpdate: Partial<DailyStatus>) => void;
    onAddMessage: (message: Message) => void;
    onAddMemory: (memory: Memory) => void;
    onShowSettings: () => void;
    onUnlockAchievement: (id: AchievementID) => void;
    onSelectSession: (id: string) => void;
    onCreateNewSession: () => void;
    onDeleteSession: (id: string) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ 
    settings, sessions, activeSession, memories, dailyStreak, dailyStatus,
    onSetDailyStatus, onAddMessage, onAddMemory, onShowSettings, onUnlockAchievement,
    onSelectSession, onCreateNewSession, onDeleteSession
}) => {
    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'send', payload: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    
    // Daily Mission Logic
    const DAILY_MISSIONS = useMemo(() => [
        "اطلب مني قصيدة عن البحر", "قولي معلومة غريبة عن الفضاء", "اكتب لي سطر كود بايثون يطبع 'مرحباً بالعالم'",
        "صف لي لوحة الموناليزا بأسلوبك", "اقترح لي كتاباً مثيراً للاهتمام", "ما هي فوائد شرب الماء؟",
        "لخص لي قصة فيلم 'Inception' في ثلاثة أسطر"
    ], []);

    const getTodaysMission = useCallback(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime());
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return DAILY_MISSIONS[dayOfYear % DAILY_MISSIONS.length];
    }, [DAILY_MISSIONS]);
    
    const todaysMissionText = useMemo(() => getTodaysMission(), [getTodaysMission]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if(activeSession) scrollToBottom();
    }, [activeSession?.messages]);
    
    useEffect(() => {
        // If a new session has just been created and there's a pending action
        if (activeSession && activeSession.messages.length <= 1 && pendingAction?.type === 'send') {
            handleSend(pendingAction.payload);
            setPendingAction(null);
        }
    }, [activeSession, pendingAction]);

    const playAudio = useCallback((text: string) => {
        if ('speechSynthesis' in window && text) {
            const utterance = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, 'تم عرض الكود'));
            utterance.lang = 'ar-EG';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    }, []);
    
    const handleSend = async (prompt?: string) => {
        const textToSend = prompt || input.trim();
        if ((!textToSend && !imageFile)) return;
        
        if (!activeSession) {
             console.error("handleSend called without an active session.");
             return;
        }
        
        const userMessageFile = imageFile;
        setInput('');
        setImageFile(null);
        
        const userMessage: Message = {
            id: Date.now().toString(),
            sender: Sender.User,
            text: textToSend,
            timestamp: Date.now(),
            ...(userMessageFile && { imageToProcess: URL.createObjectURL(userMessageFile) })
        };
        onAddMessage(userMessage);
        
        if (prompt === todaysMissionText && !dailyStatus.missionCompleted) {
            onSetDailyStatus({ missionCompleted: true });
        }
        
        setIsThinking(true);
        
        try {
            if (textToSend.startsWith("ارسم") || textToSend.startsWith("صمم")) {
                const imageUrl = await generateImage(textToSend);
                const aiMessage = {
                    id: Date.now().toString() + 'ai', sender: Sender.AI, text: `أكيد، اتفضل تصميمك لـ: "${textToSend}"`,
                    imageUrl, timestamp: Date.now()
                };
                onAddMessage(aiMessage);
                onUnlockAchievement(AchievementID.IMAGE_CREATOR);
                playAudio(aiMessage.text);
            } else if (textToSend.toLowerCase().includes("لعبة") || textToSend.toLowerCase().includes("نلعب")) {
                const triviaQuestion = await generateTriviaQuestion();
                const aiMessage = {
                    id: Date.now().toString() + 'ai', sender: Sender.AI, text: "أكيد! يلا بينا نلعب لعبة الأسئلة.",
                    trivia: triviaQuestion, timestamp: Date.now(),
                };
                onAddMessage(aiMessage);
                playAudio(aiMessage.text);
            } else {
                const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = (activeSession?.messages || [])
                    .filter(m => m.sender !== Sender.System)
                    .map(m => ({
                        role: m.sender === Sender.User ? 'user' : 'model',
                        parts: [{ text: m.text }]
                    }));

                const response = await getChatResponse(history, textToSend, settings, memories, dailyStatus.mood, userMessageFile || undefined);
                const aiText = response.text;
                
                const aiMessage = { id: Date.now().toString() + 'ai', sender: Sender.AI, text: aiText, timestamp: Date.now() };
                onAddMessage(aiMessage);
                playAudio(aiText);
                
                const memoryContent = await extractMemory(`المستخدم: ${textToSend}\nالرفيق: ${aiText}`);
                if (memoryContent) {
                    const newMemory: Memory = { id: Date.now().toString(), content: memoryContent, createdAt: Date.now() };
                    onAddMemory(newMemory);
                }
            }
        } catch (error) {
            console.error("Error processing message:", error);
            const errMessage = { id: Date.now().toString() + 'ai', sender: Sender.AI, text: "معلش، حصل خطأ. ممكن تجرب تاني؟", timestamp: Date.now() };
            onAddMessage(errMessage);
            playAudio(errMessage.text);
        } finally {
            setIsThinking(false);
        }
    };

    const handleWelcomeAction = (prompt: string) => {
        // Always create a new session for a welcome suggestion to keep topics organized.
        onCreateNewSession();
        // Use a pending action to send the prompt once the new session is created and active.
        setPendingAction({ type: 'send', payload: prompt });
    };
    
    const handleTriviaAnswer = (answer: string) => {
        const lastMessage = activeSession?.messages[activeSession.messages.length - 1];
        if (lastMessage && lastMessage.trivia) {
            const isCorrect = answer === lastMessage.trivia.correctAnswer;
            const resultText = isCorrect ? `🎉 صح! الإجابة هي ${answer}.` : `😕 غلط. الإجابة الصح هي ${lastMessage.trivia.correctAnswer}.`;
            if(isCorrect) {
                onUnlockAchievement(AchievementID.TRIVIA_MASTER);
            }
            onAddMessage({ id: Date.now().toString(), sender: Sender.User, text: `اخترت: ${answer}`, timestamp: Date.now() });
            setTimeout(() => {
                 const aiMessage = { id: Date.now().toString() + 'ai', sender: Sender.AI, text: resultText, timestamp: Date.now() };
                onAddMessage(aiMessage);
                playAudio(resultText);
            }, 500);
        }
    };
    
    const toggleListen = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) { alert("متصفحك لا يدعم التعرف على الصوت."); return; }
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'ar-EG';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => {
                setIsListening(false);
                setTimeout(() => {
                  const finalTranscript = (document.getElementById('chat-input') as HTMLInputElement)?.value;
                  if (finalTranscript) handleSend(finalTranscript);
                }, 100);
            };
            recognitionRef.current.onerror = (event) => { console.error('Speech recognition error', event); setIsListening(false); };
            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
                setInput(transcript);
                if (event.results[0].isFinal) {
                    recognitionRef.current?.stop();
                }
            };
            setInput('');
            recognitionRef.current.start();
        }
    };
    
    const showDailyCheckin = dailyStatus && !dailyStatus.mood;

    return (
        <div className="relative h-screen overflow-hidden bg-[var(--background)] text-[var(--text-primary)]">
            <aside className={`fixed top-0 bottom-0 right-0 w-72 bg-[var(--surface-1)] border-s border-[var(--border)] z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="p-4 border-b border-[var(--border)]">
                    <button 
                        onClick={() => { onCreateNewSession(); setIsSidebarOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-[var(--accent)] text-slate-900 font-bold hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        <PlusIcon className="w-5 h-5"/>
                        محادثة جديدة
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto scroll-container p-2 space-y-1">
                    {sessions.map(session => (
                        <div key={session.id} className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer ${activeSession?.id === session.id ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]'}`}>
                            <div className="flex-1 truncate" onClick={() => { onSelectSession(session.id); setIsSidebarOpen(false); }}>
                               <p className="text-sm font-semibold text-[var(--text-primary)]">{session.title}</p>
                            </div>
                             <button onClick={() => onDeleteSession(session.id)} className="p-1 text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                </nav>
            </aside>
            {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30" onClick={() => setIsSidebarOpen(false)} />}
            
            <main className="h-full flex flex-col" onClick={() => { if(isSidebarOpen) setIsSidebarOpen(false)}}>
                <header className="flex items-center justify-between p-4 border-b border-[var(--border)] h-16 flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <button onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(v => !v);}} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors">
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-[var(--surface-1)] flex items-center justify-center border border-[var(--border)]">
                           <LogoIcon className="w-6 h-6 text-[var(--accent)]" />
                        </div>
                        <div>
                           <h2 className="font-bold text-lg text-[var(--text-primary)]">{settings.aiName}</h2>
                           <p className="text-sm text-[var(--text-secondary)]">
                             {isThinking ? "يكتب..." : isSpeaking ? "يتحدث..." : "متصل"}
                           </p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-[var(--accent)]">
                            <FireIcon className="w-5 h-5" />
                            <span className="font-bold text-base">{dailyStreak}</span>
                        </div>
                        <button onClick={onShowSettings} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors">
                            <SettingsIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                
                <div className="flex-1 overflow-y-auto scroll-container p-6">
                    <div className="max-w-4xl mx-auto space-y-6 h-full">
                        {activeSession && activeSession.messages.length > 1 ? (
                            <>
                                {showDailyCheckin && (
                                    <DailyCheckin
                                        onSetMood={(mood) => onSetDailyStatus({ mood })}
                                        dailyMission={{ text: todaysMissionText, completed: dailyStatus.missionCompleted }}
                                        onMissionClick={handleWelcomeAction}
                                    />
                                )}
                                {activeSession.messages.map(msg => msg.sender !== Sender.System && (
                                    <MessageBubble key={msg.id} msg={msg} settings={settings} onPlayAudio={playAudio} onTriviaAnswer={handleTriviaAnswer}/>
                                ))}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div>
                                    {showDailyCheckin && (
                                        <div className="mb-6">
                                            <DailyCheckin
                                                onSetMood={(mood) => onSetDailyStatus({ mood })}
                                                dailyMission={{ text: todaysMissionText, completed: dailyStatus.missionCompleted }}
                                                onMissionClick={handleWelcomeAction}
                                            />
                                        </div>
                                    )}
                                    <WelcomeScreen 
                                        aiName={settings.aiName} 
                                        onSuggestionClick={handleWelcomeAction}
                                    />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-4 flex-shrink-0">
                    <div className="max-w-4xl mx-auto">
                        {imageFile && (
                            <div className="relative w-24 h-24 mb-2 p-1 border border-[var(--border)] rounded-md">
                                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover rounded"/>
                                <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 bg-[var(--surface-1)] p-2 rounded-xl border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--accent)]">
                             <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors rounded-full hover:bg-[var(--surface-2)]">
                                <ImageIcon className="w-6 h-6" />
                             </button>
                             <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setImageFile(e.target.files[0])} accept="image/*" className="hidden" />
                             
                             <input
                                 id="chat-input"
                                 type="text"
                                 value={input}
                                 onChange={e => setInput(e.target.value)}
                                 placeholder="اكتب رسالتك هنا..."
                                 className="w-full bg-transparent focus:outline-none px-2"
                                 disabled={isThinking}
                             />

                            {input.trim() || imageFile ? (
                                 <button type="submit" disabled={isThinking} className="p-2 rounded-full bg-[var(--accent)] text-slate-900 hover:bg-[var(--accent-hover)] transition-colors disabled:bg-[var(--surface-2)] disabled:text-[var(--text-secondary)]">
                                    <SendIcon className="w-6 h-6" />
                                 </button>
                            ) : (
                                 <button type="button" onClick={toggleListen} className={`p-2 transition-colors rounded-full hover:bg-[var(--surface-2)] ${isListening ? 'text-red-500' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`}>
                                     <MicIcon className="w-6 h-6" />
                                 </button>
                            )}
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChatScreen;
