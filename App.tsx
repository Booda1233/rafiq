

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from "@google/genai";
import { startChat, getTriviaQuestion, generateDailyMission, generateImageFromPrompt, createRefinedImagePrompt, getFollowUpSuggestions } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import SettingsModal from './components/SettingsModal';
import ConversationHistoryPanel from './components/ConversationHistoryPanel';
import EmptyChatView from './components/EmptyChatView';
import DailyMissionBanner from './components/DailyMissionBanner';
import ImageEditModal from './components/ImageEditModal';
import SmartFriendIcon from './components/SmartFriendIcon';
import { fileToBase64, saveUserDataToDB, getTodayDateString, isYesterday } from './utils';
import type { Message, UserData, Conversation } from './types';


// --- Helper Functions & Components ---

const getErrorMessageForUser = (error: unknown): string => {
    let errorMessage = "عفوًا يا صديقي، حدث خطأ ما. هل يمكنك المحاولة مرة أخرى بعد قليل؟ 😵"; // Default

    if (error) {
        const lowerCaseError = String(error).toLowerCase();
        
        if (lowerCaseError.includes('safety')) {
            errorMessage = "عفوًا، لم أتمكن من معالجة هذا الطلب لأنه يخالف سياسات الأمان. هل يمكنك تجربة طلب آخر؟ 🙏";
        } else if (lowerCaseError.includes('network') || lowerCaseError.includes('fetch failed') || lowerCaseError.includes('offline')) {
            errorMessage = "عفوًا، يبدو أن هناك مشكلة في الاتصال بالإنترنت. 📶 يرجى التحقق من اتصالك والمحاولة مرة أخرى.";
        } else if (lowerCaseError.includes('api key') || lowerCaseError.includes('500') || lowerCaseError.includes('internal server error')) {
            errorMessage = "عفوًا، أواجه صعوبات فنية في الوقت الحالي. 🛠️ يرجى المحاولة مرة أخرى بعد قليل.";
        } else if (lowerCaseError.includes('json')) {
            errorMessage = "عفوًا، واجهت مشكلة أثناء تحليل الرد من الخادم. لنجرب شيئًا آخر. 🤔";
        }
    }
    return errorMessage;
};


const SplashScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-dark)] text-[var(--text-main)] animate-in fade-in duration-500">
        <div className="relative w-32 h-32 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] rounded-full blur-3xl opacity-40 animate-pulse-glow"></div>
             <SmartFriendIcon className="w-28 h-28 text-white z-10 drop-shadow-[0_0_20px_rgba(0,169,255,0.5)]" />
        </div>
        <p className="text-[var(--text-secondary)] mt-8 text-lg font-semibold tracking-wider">جاري تجهيز عالمك الخاص...</p>
    </div>
);


const SetupScreen: React.FC<{ onSetupComplete: (data: UserData) => void }> = ({ onSetupComplete }) => {
  const [userName, setUserName] = useState('');
  const [aiName, setAiName] = useState('صديقي');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && aiName.trim()) {
      onSetupComplete({
        userName: userName.trim(),
        aiName: aiName.trim(),
        userAvatar: `https://api.dicebear.com/8.x/adventurer/svg?seed=${userName.trim()}`,
        aiAvatar: `https://api.dicebear.com/8.x/micah/svg?seed=${aiName.trim()}`,
        chatBackground: 'neon_nexus', // Default background
        memory: [],
        notificationsEnabled: false,
        dailyStreak: 0,
        lastInteractionDate: '',
        dailyMission: { text: '', keyword: '', completed: true }, // Start with a completed mission
      });
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg-dark)] text-[var(--text-main)] p-4 animate-in fade-in">
        <div className="w-full max-w-md bg-[var(--bg-surface)]/60 backdrop-blur-2xl border border-[var(--border-color)] p-8 rounded-3xl shadow-2xl text-center shadow-[var(--primary-from)]/20">
            
            <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] rounded-full blur-3xl opacity-50 animate-pulse-glow"></div>
                <SmartFriendIcon className="w-24 h-24 text-white z-10 drop-shadow-[0_0_20px_rgba(0,169,255,0.5)]" />
            </div>

            <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-br from-white to-[var(--text-main)] bg-clip-text text-transparent">أهلاً بك في عالمك الخاص</h1>
            <p className="text-[var(--text-secondary)] mb-8">لنبدأ ببناء شخصية صديقك. كيف يمكنني مناداتك؟</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="اكتب اسمك هنا..."
                        className="w-full bg-[var(--bg-dark)] text-white rounded-full py-3 pr-14 pl-5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)] focus:ring-[var(--primary-from)] transition border border-[var(--border-color)] placeholder:text-[var(--text-secondary)] h-14 text-lg"
                        required
                    />
                </div>
                
                <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={aiName}
                        onChange={(e) => setAiName(e.target.value)}
                        placeholder="اختر اسماً لصديقك..."
                        className="w-full bg-[var(--bg-dark)] text-white rounded-full py-3 pr-14 pl-5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)] focus:ring-[var(--primary-from)] transition border border-[var(--border-color)] placeholder:text-[var(--text-secondary)] h-14 text-lg"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] text-white font-bold py-3.5 px-4 rounded-full hover:shadow-lg hover:shadow-[var(--primary-from)]/30 transition-all duration-300 transform hover:scale-105 text-lg !mt-6"
                >
                    تأكيد وبدء الرحلة
                </button>
            </form>
        </div>
    </div>
  );
};

const fallbackMissions = [
    { mission: 'اسألني عن الطقس اليوم', keyword: 'weather' },
    { mission: 'اطلب مني أن أصف لك صورة لقطة', keyword: 'cat' },
    { mission: 'قل لي نكتة', keyword: 'joke' },
    { mission: 'ما هو اقتباس اليوم الملهم؟', keyword: 'quote' },
    { mission: 'اطلب مني كتابة قصيدة قصيرة عن الصداقة', keyword: 'poem' },
];

const getBackgroundClass = (bg?: string): string => {
    switch (bg) {
        case 'data_stream': return 'bg-data-stream';
        case 'holo_grid': return 'bg-holo-grid';
        case 'cyber_grid': return 'bg-cyber-grid';
        case 'solid': return 'bg-solid';
        case 'neon_nexus':
        default:
            return 'bg-neon-nexus';
    }
};

// --- Main App Component ---

const App: React.FC = () => {
  const [appState, setAppState] = useState<'LOADING' | 'SETUP' | 'CHAT'>('LOADING');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const [imageToEdit, setImageToEdit] = useState<Message | null>(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);

  const chatRef = useRef<Chat | null>(null);
  const chatAreaRef = useRef<HTMLDivElement | null>(null);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages ?? [];
  const userData = activeConversation?.userData;

  const handleSaveSettings = useCallback((newUserData: UserData, options: { closeModal: boolean } = { closeModal: true }) => {
    if (!activeConversationId) return;
    const oldUserData = userData;
    
    const updatedWithAvatars = {
        ...newUserData,
        userAvatar: `https://api.dicebear.com/8.x/adventurer/svg?seed=${newUserData.userName.trim()}`,
        aiAvatar: `https://api.dicebear.com/8.x/micah/svg?seed=${newUserData.aiName.trim()}`
    };

    saveUserDataToDB(updatedWithAvatars);

    setConversations(prev => prev.map(c => {
      // Apply new settings to ALL conversations to keep user data consistent
      const updatedUserDataAll = { ...c.userData, ...updatedWithAvatars };
      if (c.id === activeConversationId) {
          if(oldUserData?.aiName !== updatedWithAvatars.aiName || oldUserData?.userName !== updatedWithAvatars.userName) {
              chatRef.current = startChat(updatedWithAvatars.aiName, updatedWithAvatars.userName, updatedWithAvatars.memory, c.messages);
          }
          return { ...c, userData: updatedUserDataAll, lastUpdated: Date.now() };
      }
      return { ...c, userData: updatedUserDataAll };
    }));
    
    if (options.closeModal) {
        setIsSettingsOpen(false);
    }
  }, [activeConversationId, userData]);

  useEffect(() => {
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
            setVoices(availableVoices.filter(v => v.lang.startsWith('ar')));
        }
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('Service Worker registered with scope:', registration.scope))
            .catch(error => console.log('Service Worker registration failed:', error));
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PeriodicSyncManager' in window) {
        navigator.serviceWorker.ready.then(async (registration) => {
            if (Notification.permission !== 'granted') {
                try {
                    await registration.periodicSync.unregister('check-in-notification');
                } catch(e) { /* ignore */ }
                return;
            }

            if (userData?.notificationsEnabled) {
                try {
                    const tags = await registration.periodicSync.getTags();
                    if (!tags.includes('check-in-notification')) {
                        await registration.periodicSync.register('check-in-notification', {
                            minInterval: 2 * 60 * 60 * 1000, // 2 hours
                        });
                    }
                } catch (e) {
                    console.error('Periodic sync could not be registered!', e);
                }
            } else {
                try {
                    await registration.periodicSync.unregister('check-in-notification');
                } catch(e) {
                     console.error('Periodic sync could not be unregistered!', e);
                }
            }
        });
    }
  }, [userData?.notificationsEnabled]);


  // This effect runs only once on mount to initialize the app
  useEffect(() => {
    const initializeApp = async () => {
        try {
            const storedConversations = localStorage.getItem('conversations');
            if (storedConversations) {
                const loadedConversations: Conversation[] = JSON.parse(storedConversations);

                if (loadedConversations.length > 0) {
                    const sortedConversations = loadedConversations.sort((a, b) => b.lastUpdated - a.lastUpdated);
                    let latestUserData = { ...sortedConversations[0].userData }; // Make a copy
                    const today = getTodayDateString();
                    let needsUserDataUpdate = false;

                    // --- Daily Update Logic ---
                    if (latestUserData.lastInteractionDate !== today) {
                        needsUserDataUpdate = true;
                        
                        // 1. Update Streak
                        let newStreak = latestUserData.dailyStreak || 0;
                        if (isYesterday(latestUserData.lastInteractionDate)) {
                            newStreak++;
                        } else {
                            newStreak = 1; // Reset or start streak
                        }
                        latestUserData.dailyStreak = newStreak;

                        // 2. Fetch new mission
                        try {
                            const missionResponse = await generateDailyMission();
                            const missionData = JSON.parse(missionResponse.text);
                            latestUserData.dailyMission = {
                                text: missionData.mission,
                                keyword: missionData.keyword.toLowerCase(),
                                completed: false,
                            };
                        } catch (error) {
                            console.error("Failed to fetch daily mission, using fallback.", error);
                            const randomMission = fallbackMissions[Math.floor(Math.random() * fallbackMissions.length)];
                            latestUserData.dailyMission = {
                                text: randomMission.mission,
                                keyword: randomMission.keyword,
                                completed: false,
                            };
                        }
                    }

                    let finalConversations = sortedConversations.map(c => ({
                        ...c,
                        userData: {
                            ...c.userData,
                            chatBackground: c.userData.chatBackground || 'neon_nexus' // Ensure default background
                        }
                    }));
                    
                    if (needsUserDataUpdate) {
                        // Apply updated user data (streak, mission) to ALL conversations for consistency
                        finalConversations = finalConversations.map(c => ({
                           ...c,
                           userData: {
                               ...c.userData,
                               dailyStreak: latestUserData.dailyStreak,
                               dailyMission: latestUserData.dailyMission
                           }
                        }));
                        saveUserDataToDB(latestUserData);
                    }

                    setConversations(finalConversations);
                    const activeConvo = finalConversations[0];
                    setActiveConversationId(activeConvo.id);
                    const { aiName, userName, memory } = activeConvo.userData;
                    chatRef.current = startChat(aiName, userName, memory || [], activeConvo.messages);
                    setAppState('CHAT');

                } else {
                   setAppState('SETUP');
                }
            } else {
                setAppState('SETUP');
            }
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
            localStorage.clear();
            setAppState('SETUP');
        }
    };

    setTimeout(initializeApp, 1500);

  }, []); // Empty dependency array ensures this runs only once on mount
  
  useEffect(() => {
    if (appState === 'CHAT' && conversations.length > 0) {
      try {
        // Remove volatile image URLs before saving
        const conversationsToStore = conversations.map(convo => ({
            ...convo,
            messages: convo.messages.map(({ imageUrl, ...rest }) => ({
                ...rest,
                // Don't save user-uploaded base64 to save space, only AI-generated
                base64Image: rest.sender === 'ai' ? rest.base64Image : undefined,
                mimeType: rest.sender === 'ai' ? rest.mimeType : undefined,
            })),
        }));
        localStorage.setItem('conversations', JSON.stringify(conversationsToStore));
      } catch (error) {
        console.error("Failed to save conversations", error);
      }
    }
  }, [conversations, appState]);
  
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping, followUpSuggestions]);

  const handleSetupComplete = (data: UserData) => {
    const newId = `convo-${Date.now()}`;
    const newConversation: Conversation = {
        id: newId,
        title: `محادثة مع ${data.aiName}`,
        messages: [{ id: 'init', text: `أهلاً يا ${data.userName}! أنا ${data.aiName}، ومبسوط جدًا إني هكون صديقك. يلا بينا نتكلم! 😊`, sender: 'ai' }],
        userData: data,
        lastUpdated: Date.now()
    };
    
    setConversations([newConversation]);
    setActiveConversationId(newId);
    saveUserDataToDB(data);
    chatRef.current = startChat(data.aiName, data.userName, data.memory || [], []);
    setAppState('CHAT');
  };
  
  const handleSelectConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if(conversation) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        setActiveConversationId(id);
        const { aiName, userName, memory } = conversation.userData;
        chatRef.current = startChat(aiName, userName, memory || [], conversation.messages);
        setIsSidebarOpen(false);
    }
  };
  
  const handleNewChat = () => {
    const latestConversation = conversations.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
    if (!latestConversation) return;
    
    const userDataForNewChat = latestConversation.userData;
    
    const greetings = [
      `إزيك يا ${userDataForNewChat.userName}! إيه الأخبار؟ يلا بينا نكمل كلام. 😄`,
      `أهلاً يا صاحبي ${userDataForNewChat.userName}! عامل إيه النهاردة؟ مستعد لدردشة جديدة؟ 🤔`,
    ];
    const initialMessageText = greetings[Math.floor(Math.random() * greetings.length)];

    const newId = `convo-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: "محادثة جديدة",
      messages: [{ id: 'init', text: initialMessageText, sender: 'ai' }],
      userData: userDataForNewChat,
      lastUpdated: Date.now()
    };
    setConversations(prev => [newConversation, ...prev.sort((a,b) => b.lastUpdated - a.lastUpdated)]);
    setActiveConversationId(newId);
    const { aiName, userName, memory } = userDataForNewChat;
    chatRef.current = startChat(aiName, userName, memory || [], []);
    setIsSidebarOpen(false);
  };
  
  const handleDeleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    
    if(activeConversationId === id) {
        window.speechSynthesis.cancel();
        if(updatedConversations.length > 0) {
            const latest = updatedConversations.sort((a,b) => b.lastUpdated - a.lastUpdated)[0];
            handleSelectConversation(latest.id);
        } else {
            setActiveConversationId(null);
            localStorage.removeItem('conversations');
            setAppState('SETUP');
        }
    }
  };

  const updateMessageInConversation = (convoId: string, messageId: string, updates: Partial<Message>) => {
    setConversations(prev => prev.map(c => {
        if (c.id === convoId) {
            return {
                ...c,
                messages: c.messages.map(m => m.id === messageId ? { ...m, ...updates } : m),
                lastUpdated: Date.now()
            };
        }
        return c;
    }));
  };

  const addMessageToConversation = (id: string, message: Message) => {
     setConversations(prev => prev.map(c => {
        if (c.id === id) {
            return { ...c, messages: [...c.messages, message], lastUpdated: Date.now() };
        }
        return c;
    }));
  };
  
  const updateMemory = (newFact: string) => {
    if (!activeConversationId) return;

    setConversations(prev => prev.map(c => {
        const currentMemory = c.userData.memory || [];
        // Update memory for all conversations to keep it consistent
        if (!currentMemory.includes(newFact)) {
            const updatedUserData = { ...c.userData, memory: [...currentMemory, newFact] };
            return { ...c, userData: updatedUserData };
        }
        return c;
    }));
  };
  
  const handlePlayAudio = (text: string, messageId: string) => {
      window.speechSynthesis.cancel();
  
      if (speakingMessageId === messageId) {
          setSpeakingMessageId(null);
          return;
      }
  
      const utterance = new SpeechSynthesisUtterance(text);
      const voiceToUse = voices.find(v => v.lang === 'ar-EG') || voices.find(v => v.lang.startsWith('ar-'));
      
      if (voiceToUse) {
          utterance.voice = voiceToUse;
          utterance.lang = voiceToUse.lang;
      } else {
          utterance.lang = 'ar-EG';
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1;
  
      utterance.onstart = () => setSpeakingMessageId(messageId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => {
        setSpeakingMessageId(null);
        console.error("Speech synthesis error");
      };
  
      window.speechSynthesis.speak(utterance);
  };
  
  const startTriviaGame = async () => {
    if (!activeConversationId || !userData) return;
    setIsLoading(true);
    addMessageToConversation(activeConversationId, {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: 'بالتأكيد! لنلعب قليلاً. إليك سؤال...'
    });
    setIsTyping(true);

    try {
        const response = await getTriviaQuestion();
        const triviaData = JSON.parse(response.text);
        const triviaMessage: Message = {
            id: `trivia-${Date.now()}`,
            sender: 'ai',
            text: '',
            type: 'trivia',
            trivia: {
                question: triviaData.question,
                options: triviaData.options,
                answer: triviaData.answer,
            }
        };
        addMessageToConversation(activeConversationId, triviaMessage);
    } catch(error) {
        console.error("Failed to start trivia", error);
        addMessageToConversation(activeConversationId, {
            id: `err-${Date.now()}`,
            sender: 'ai',
            text: getErrorMessageForUser(error)
        });
    } finally {
        setIsLoading(false);
        setIsTyping(false);
    }
  };

  const handleAnswerTrivia = (messageId: string, userAnswer: string) => {
      if (!activeConversationId) return;
      const message = messages.find(m => m.id === messageId);
      if (!message || !message.trivia || message.trivia.userAnswer) return;

      const isCorrect = userAnswer === message.trivia.answer;
      
      const updatedTrivia = { ...message.trivia, userAnswer, isCorrect };
      updateMessageInConversation(activeConversationId, messageId, { trivia: updatedTrivia });

      const followUpText = isCorrect
          ? `رائع! إجابة صحيحة. 🎉`
          : `إجابة خاطئة. الإجابة الصحيحة هي: "${message.trivia.answer}".`;
      
      const followUpMessage: Message = {
          id: `ai-resp-${Date.now()}`,
          sender: 'ai',
          text: `${followUpText} هل تريد أن نلعب جولة أخرى؟`
      };
      setTimeout(() => addMessageToConversation(activeConversationId, followUpMessage), 500);
  };
  
    const handleEditImageRequest = (message: Message) => {
        if (message.type === 'generated_image') {
            setImageToEdit(message);
        }
    };

    const handleConfirmImageEdit = async (originalMessage: Message, modification: string) => {
        if (!activeConversationId || !originalMessage.originalPrompt) return;
        
        setIsTyping(true);
        setImageToEdit(null); // Close modal immediately

        try {
            addMessageToConversation(activeConversationId, {
                id: `user-edit-${Date.now()}`,
                sender: 'user',
                text: `تعديل على الصورة: "${modification}"`
            });

            const refinedPrompt = await createRefinedImagePrompt(originalMessage.originalPrompt, modification);
            
            const imageBase64 = await generateImageFromPrompt(refinedPrompt);

            const newMessage: Message = {
                id: `ai-edited-${Date.now()}`,
                sender: 'ai',
                type: 'generated_image',
                text: `تفضل، هذه هي الصورة بعد التعديل. هل أعجبتك؟`,
                base64Image: imageBase64,
                originalPrompt: refinedPrompt,
            };
            addMessageToConversation(activeConversationId, newMessage);

        } catch (error) {
            console.error("Failed to edit image:", error);
            addMessageToConversation(activeConversationId, {
                id: `err-${Date.now()}`,
                sender: 'ai',
                text: getErrorMessageForUser(error),
            });
        } finally {
            setIsTyping(false);
        }
    };

    const fetchFollowUpSuggestions = useCallback(async (userInput: string, aiResponse: string) => {
        if (!userData) return;
        const suggestions = await getFollowUpSuggestions(userData.userName, userData.aiName, userInput, aiResponse);
        // Add a small delay for a more natural feel
        setTimeout(() => {
            // Only set suggestions if the last message is still the one that triggered them
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.sender === 'ai' && lastMessage?.text === aiResponse) {
                setFollowUpSuggestions(suggestions);
            }
        }, 500);
    }, [userData, messages]);

    const handleSuggestionClick = (suggestion: string) => {
        setFollowUpSuggestions([]); // Clear suggestions
        setChatInputValue(suggestion); // Put suggestion in input
        handleSendMessage(suggestion);
    };

  const handleSendMessage = async (userInput: string, file?: File) => {
    if (!chatRef.current || isLoading || !activeConversationId || !userData || (!userInput && !file)) return;

    setFollowUpSuggestions([]); // Clear old suggestions immediately

    if (/تريفيا|اسئله|أسئلة|لعبة|game|trivia/i.test(userInput)) {
        setChatInputValue('');
        await startTriviaGame();
        return;
    }

    setIsLoading(true);
    setChatInputValue('');

    if(userData.lastInteractionDate !== getTodayDateString()) {
        handleSaveSettings({ ...userData, lastInteractionDate: getTodayDateString() }, { closeModal: false });
    }

    if (userData.dailyMission && !userData.dailyMission.completed) {
        if (userInput.toLowerCase().includes(userData.dailyMission.keyword)) {
            const updatedUserData = { ...userData, dailyMission: { ...userData.dailyMission, completed: true } };
            handleSaveSettings(updatedUserData, { closeModal: false });
            addMessageToConversation(activeConversationId, {
                id: `mission-${Date.now()}`,
                sender: 'ai',
                type: 'mission_completed',
                text: 'أحسنت! لقد أكملت مهمة اليوم.'
            });
        }
    }

    let userMessage: Message;
    let fileUrlForCleanup: string | undefined;

    if (file) {
        try {
            const base64Image = await fileToBase64(file);
            const mimeType = file.type;
            const isImage = mimeType.startsWith('image/');
            const fileUrl = isImage ? URL.createObjectURL(file) : undefined;
            if(fileUrl) fileUrlForCleanup = fileUrl;

            userMessage = { 
                id: `user-${Date.now()}`, 
                text: userInput, 
                sender: 'user', 
                imageUrl: fileUrl, 
                base64Image, 
                mimeType,
                fileName: file.name
            };
        } catch (error) {
            console.error("Error processing user file:", error);
            addMessageToConversation(activeConversationId, { id: `error-file-${Date.now()}`, text: "عذراً، لم أتمكن من قراءة الملف المرفق.", sender: 'ai' });
            setIsLoading(false);
            return;
        }
    } else {
        userMessage = { id: `user-${Date.now()}`, text: userInput, sender: 'user' };
    }
    
    addMessageToConversation(activeConversationId, userMessage);
    
    if (activeConversation?.messages.length < 4 && userInput && activeConversation.title === 'محادثة جديدة') {
       setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, title: userInput.substring(0, 40) + (userInput.length > 40 ? '...' : ''), lastUpdated: Date.now() } : c));
    }
    
    setIsTyping(true);

    try {
        const messageParts = [];
        if (userInput) messageParts.push({ text: userInput });
        if (userMessage.base64Image && userMessage.mimeType) {
            messageParts.push({ inlineData: { data: userMessage.base64Image, mimeType: userMessage.mimeType } });
        }

        const response = await chatRef.current.sendMessage({ message: messageParts });
        setIsTyping(false);
      
        let aiResponseText = response.text || '';
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        const memoryRegex = /<THINK>MEMORIZE: (.*?)<\/THINK>/s;
        const memoryMatch = aiResponseText.match(memoryRegex);
        if (memoryMatch && memoryMatch[1]) {
            updateMemory(memoryMatch[1].trim());
        }
        let cleanedText = aiResponseText.replace(memoryRegex, '').trim();

        const imagePromptRegex = /<GENERATE_IMAGE_PROMPT>(.*?)<\/GENERATE_IMAGE_PROMPT>/s;
        const imagePromptMatch = cleanedText.match(imagePromptRegex);

        if (imagePromptMatch && imagePromptMatch[1]) {
            setIsTyping(true);
            const imagePrompt = imagePromptMatch[1].trim();
            try {
                const imageBase64 = await generateImageFromPrompt(imagePrompt);
                const newMessage: Message = {
                    id: `ai-gen-${Date.now()}`,
                    sender: 'ai',
                    type: 'generated_image',
                    text: `بالتأكيد، تم إنشاء هذه الصورة خصيصًا لك.`,
                    base64Image: imageBase64,
                    originalPrompt: imagePrompt,
                    mimeType: 'image/jpeg',
                };
                addMessageToConversation(activeConversationId, newMessage);
                 fetchFollowUpSuggestions(userInput, newMessage.text);
            } catch (imgError) {
                 console.error("Image generation failed:", imgError);
                 addMessageToConversation(activeConversationId, { 
                    id: `error-img-${Date.now()}`, 
                    text: getErrorMessageForUser(imgError), 
                    sender: 'ai' 
                });
            }
            setIsTyping(false);
            return; // End processing here
        }

        const imageUrlMatch = cleanedText.match(/\[IMAGE_URL\](.*?)\[\/IMAGE_URL\]/s);
        let finalMessage: Message;

        if (imageUrlMatch && imageUrlMatch[1]) {
            const imageUrl = imageUrlMatch[1].trim();
            const textContent = cleanedText.replace(/\[IMAGE_URL\].*?\[\/IMAGE_URL\]/s, '').trim();
            finalMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: textContent, imageUrl: imageUrl, mimeType: 'image/png' };
        } else {
            finalMessage = { id: `ai-${Date.now()}`, text: cleanedText, sender: 'ai' };
        }

        if (finalMessage.text || finalMessage.imageUrl) {
            addMessageToConversation(activeConversationId, finalMessage);
            // Fire-and-forget call for suggestions
            if (finalMessage.text) {
                fetchFollowUpSuggestions(userInput, finalMessage.text);
            }
        }

        if (groundingChunks && groundingChunks.length > 0) {
            const sourcesText = groundingChunks
                .map((chunk: any, index: number) => {
                    const uri = chunk?.web?.uri;
                    const title = chunk?.web?.title || uri;
                    if (typeof uri === 'string' && uri) {
                        return `${index + 1}. [${String(title).replace(/[\[\]]/g, '')}](${uri})`;
                    }
                    return null;
                })
                .filter(Boolean)
                .join('\n');
            
            if (sourcesText) {
                const sourcesMessage: Message = {
                    id: `source-${Date.now()}`,
                    sender: 'ai',
                    type: 'source_info',
                    text: `**المصادر:**\n${sourcesText}`
                };
                addMessageToConversation(activeConversationId, sourcesMessage);
            }
        }

    } catch (error) {
        console.error("Error sending message:", error);
        addMessageToConversation(activeConversationId, { 
            id: `error-${Date.now()}`, 
            text: getErrorMessageForUser(error), 
            sender: 'ai' 
        });
    } finally {
        setIsLoading(false);
        setIsTyping(false);
        if (fileUrlForCleanup) {
            URL.revokeObjectURL(fileUrlForCleanup);
        }
    }
  };

  if (appState === 'LOADING') {
    return <SplashScreen />;
  }

  if (appState === 'SETUP' || !userData || !activeConversation) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }
  
  const isInitialState = messages.length === 1 && messages[0].id === 'init';
  const backgroundClass = getBackgroundClass(userData.chatBackground);


  return (
    <>
      <div className={`flex flex-col h-screen bg-transparent text-white md:max-w-5xl md:mx-auto md:border-x md:border-[var(--border-color)] md:shadow-2xl md:shadow-black/50 relative overflow-hidden ${backgroundClass}`} dir="rtl">
        <div className="absolute top-0 right-0 left-0 h-96 bg-gradient-to-b from-[var(--bg-dark)]/80 via-[var(--bg-surface)]/20 to-transparent -z-10"></div>
        <Header 
            aiName={userData.aiName} 
            aiAvatar={userData.aiAvatar}
            dailyStreak={userData.dailyStreak || 0}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen(true)} 
        />
        <main ref={chatAreaRef} className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col">
          <div className="flex-grow space-y-2">
            {isInitialState ? (
              <EmptyChatView 
                  onSendMessage={(text) => handleSendMessage(text)}
              />
            ) : (
              messages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    avatar={msg.sender === 'ai' ? userData.aiAvatar : userData.userAvatar}
                    onPlayAudio={handlePlayAudio}
                    isSpeaking={speakingMessageId === msg.id}
                    onAnswerTrivia={handleAnswerTrivia}
                    onEditImage={handleEditImageRequest}
                  />
                ))
            )}
            {isTyping && <TypingIndicator />}
          </div>
          {followUpSuggestions.length > 0 && !isTyping && (
              <div className="flex justify-center items-center gap-2 flex-wrap p-2 animate-in fade-in">
                  {followUpSuggestions.map((suggestion, index) => (
                      <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="py-2 px-4 rounded-full bg-[var(--bg-surface)]/80 backdrop-blur-sm hover:bg-[var(--bg-surface-hover)] text-sm text-[var(--text-secondary)] hover:text-white transition-all border border-[var(--border-color)]"
                      >
                          {suggestion}
                      </button>
                  ))}
              </div>
          )}
        </main>
        
        <div className="flex-shrink-0">
            {userData.dailyMission && !userData.dailyMission.completed && (
                <DailyMissionBanner 
                    missionText={userData.dailyMission.text}
                />
            )}
            <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                inputValue={chatInputValue}
                setInputValue={setChatInputValue}
            />
        </div>
      </div>

      <ConversationHistoryPanel 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        userData={userData}
      />

      <ImageEditModal
        isOpen={!!imageToEdit}
        onClose={() => setImageToEdit(null)}
        messageToEdit={imageToEdit}
        onConfirmEdit={handleConfirmImageEdit}
      />
    </>
  );
};

export default App;
