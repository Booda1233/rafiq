import React, { useState, useEffect, useCallback, useMemo } from 'react';
import OnboardingModal from './components/OnboardingModal';
import SettingsModal from './components/SettingsModal';
import ChatScreen from './components/ChatScreen';
import SplashScreen from './components/SplashScreen';
import { UserSettings, ChatSession, Sender, Message, Memory, AIGender, DailyStatus, Mood, Achievement, AchievementID } from './types';
import { getChatSessions, saveChatSession, deleteChatSession, getMemories, saveMemory, deleteMemory } from './services/db';
import { generateTitleForSession } from './services/gemini';
import { ALL_ACHIEVEMENTS } from './achievements';
import { SparkleIcon, TrophyIcon } from './components/icons';

const AchievementToast: React.FC<{ achievement: Achievement, onClose: () => void }> = ({ achievement, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-5 right-5 bg-gradient-to-br from-[var(--accent)] to-cyan-600 text-white p-4 rounded-xl shadow-2xl z-[9999] flex items-center gap-4 animate-fadeIn">
            <SparkleIcon className="w-8 h-8 flex-shrink-0" />
            <div>
                <h3 className="font-bold">تم فتح إنجاز جديد!</h3>
                <p className="text-sm">{achievement.title}</p>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const handleUnlockAchievement = useCallback((id: AchievementID) => {
    setSettings(prev => {
        if (!prev || prev.unlockedAchievements.includes(id)) return prev;
        
        const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
        if(achievement) {
            setAchievementToast(achievement);
        }

        const newSettings = { ...prev, unlockedAchievements: [...prev.unlockedAchievements, id] };
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        return newSettings;
    });
  }, []);

  const loadInitialData = useCallback(async () => {
    // Load settings
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      let parsedSettings: UserSettings = JSON.parse(savedSettings);
      if (!parsedSettings.aiGender) parsedSettings.aiGender = AIGender.Male;
      if (!parsedSettings.unlockedAchievements) parsedSettings.unlockedAchievements = [];
      setSettings(parsedSettings);
      if (parsedSettings.notificationsEnabled) {
          registerServiceWorkerAndStart(parsedSettings.userName, parsedSettings.aiName);
      }
    }
    
    // Load chat sessions and memories
    const [dbSessions, dbMemories] = await Promise.all([getChatSessions(), getMemories()]);
    setSessions(dbSessions);
    if (dbSessions.length > 0) setActiveSessionId(dbSessions[0].id);
    setMemories(dbMemories);

    // Load Daily Status (Mood & Mission)
    const savedDailyStatus = localStorage.getItem('dailyStatus');
    const todayStr = new Date().toISOString().split('T')[0];
    if (savedDailyStatus) {
        const parsedStatus: DailyStatus = JSON.parse(savedDailyStatus);
        if (parsedStatus.date === todayStr) {
            setDailyStatus(parsedStatus);
        } else {
            // It's a new day
            setDailyStatus({ date: todayStr, mood: null, missionCompleted: false });
        }
    } else {
        setDailyStatus({ date: todayStr, mood: null, missionCompleted: false });
    }

    // Load streak
    const lastVisit = localStorage.getItem('lastVisitDate');
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const streak = parseInt(localStorage.getItem('dailyStreak') || '0');

    if (lastVisit === today) {
        setDailyStreak(streak);
    } else if (lastVisit === yesterday) {
        setDailyStreak(streak); 
    } else {
        setDailyStreak(0);
        localStorage.setItem('dailyStreak', '0');
    }

    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);
  
  const registerServiceWorkerAndStart = (userName: string, aiName: string) => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.register('/service-worker.js').then(registration => {
        registration.active?.postMessage({ action: 'start', userName, aiName, interval: 2 * 60 * 60 * 1000 });
      }).catch(error => console.error('Service Worker registration failed:', error));
    }
  };

  const stopServiceWorker = () => {
      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(registration => {
              registration?.active?.postMessage({ action: 'stop' });
          });
      }
  };

  const handleOnboardingComplete = (newSettings: Pick<UserSettings, 'userName' | 'aiName' | 'aiGender'>) => {
    const fullSettings: UserSettings = {
        ...newSettings,
        notificationsEnabled: false,
        unlockedAchievements: [AchievementID.FIRST_ONBOARDING],
    };
    localStorage.setItem('userSettings', JSON.stringify(fullSettings));
    setSettings(fullSettings);
    handleUnlockAchievement(AchievementID.FIRST_ONBOARDING);
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `محادثة مع ${fullSettings.aiName}`,
      messages: [{ id: 'system-intro', sender: Sender.System, text: `بداية محادثتك.`, timestamp: Date.now() }],
      createdAt: Date.now(),
    };
    setSessions([newSession]);
    setActiveSessionId(newSession.id);
    saveChatSession(newSession);
  };
  
  const handleSaveSettings = async (newSettings: UserSettings) => {
      setSettings(newSettings);
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      if(newSettings.notificationsEnabled){
          registerServiceWorkerAndStart(newSettings.userName, newSettings.aiName);
      } else {
          stopServiceWorker();
      }
      setIsSettingsOpen(false);
  };
  
  const handleSetDailyStatus = (statusUpdate: Partial<DailyStatus>) => {
    setDailyStatus(prev => {
        if(!prev) return null;
        const newStatus = { ...prev, ...statusUpdate };
        localStorage.setItem('dailyStatus', JSON.stringify(newStatus));
        if(statusUpdate.missionCompleted) {
            handleUnlockAchievement(AchievementID.FIRST_MISSION);
        }
        return newStatus;
    });
  };

  const handleAddMessage = useCallback((message: Message) => {
    if (!activeSessionId) return;

    setSessions(prevSessions => {
        const targetSession = prevSessions.find(s => s.id === activeSessionId);
        if (!targetSession) return prevSessions;
        
        if (targetSession.messages.length + 1 >= 50) {
            handleUnlockAchievement(AchievementID.CHATTY_USER);
        }

        const updatedSession: ChatSession = {
            ...targetSession,
            messages: [...targetSession.messages, message],
            createdAt: Date.now(),
        };
        saveChatSession(updatedSession);

        const otherSessions = prevSessions.filter(s => s.id !== activeSessionId);
        return [updatedSession, ...otherSessions];
    });

    handleUpdateStreak();
  }, [activeSessionId, handleUnlockAchievement]);

  const handleCreateNewSession = () => {
    if (!settings) return;
    const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'محادثة جديدة',
        messages: [{ id: 'system-intro', sender: Sender.System, text: `بداية محادثتك.`, timestamp: Date.now() }],
        createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    saveChatSession(newSession);
  };
  
  const handleSelectSession = (id: string) => { setActiveSessionId(id); };

  const handleDeleteSession = async (id: string) => {
    const remainingSessions = sessions.filter(s => s.id !== id);
    setSessions(remainingSessions);
    await deleteChatSession(id);
    if (activeSessionId === id) {
        setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  const handleAddMemory = async (memory: Memory) => {
    setMemories(prev => [...prev, memory]);
    await saveMemory(memory);
    handleUnlockAchievement(AchievementID.MEMORY_MAKER);
  };

  const handleDeleteMemory = async (id: string) => {
      setMemories(prev => prev.filter(m => m.id !== id));
      await deleteMemory(id);
  };
  
  const handleUpdateStreak = () => {
      const lastVisit = localStorage.getItem('lastVisitDate');
      const today = new Date().toDateString();
      if (lastVisit === today) return;

      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const currentStreak = parseInt(localStorage.getItem('dailyStreak') || '0');
      const newStreak = lastVisit === yesterday ? currentStreak + 1 : 1;
      
      if (newStreak >= 3) {
          handleUnlockAchievement(AchievementID.STREAK_3_DAYS);
      }
      
      setDailyStreak(newStreak);
      localStorage.setItem('dailyStreak', newStreak.toString());
      localStorage.setItem('lastVisitDate', today);
  };
    
  useEffect(() => {
    if (activeSession && activeSession.messages.length === 4 && (activeSession.title.startsWith('محادثة مع') || activeSession.title === 'محادثة جديدة')) {
      const handleAutoTitle = async (sessionToUpdate: ChatSession) => {
        const conversationText = sessionToUpdate.messages
          .filter(m => m.sender === 'user' || m.sender === 'ai')
          .map(m => `${m.sender}: ${m.text}`)
          .join('\n');
        const newTitle = await generateTitleForSession(conversationText);
        
        setSessions(prevSessions => {
            return prevSessions.map(s => {
                if (s.id === sessionToUpdate.id) {
                    const updatedSession = { ...s, title: newTitle };
                    saveChatSession(updatedSession);
                    return updatedSession;
                }
                return s;
            });
        });
      };
      handleAutoTitle(activeSession);
    }
  }, [activeSession]);

  if (isLoading) return <SplashScreen />;
  if (!settings) return <OnboardingModal onComplete={handleOnboardingComplete} />;
  
  return (
    <>
      {achievementToast && (
          <AchievementToast 
              achievement={achievementToast} 
              onClose={() => setAchievementToast(null)} 
          />
      )}
      <ChatScreen
        settings={settings}
        sessions={sessions}
        activeSession={activeSession}
        memories={memories}
        dailyStreak={dailyStreak}
        dailyStatus={dailyStatus!}
        onSetDailyStatus={handleSetDailyStatus}
        onAddMessage={handleAddMessage}
        onAddMemory={handleAddMemory}
        onShowSettings={() => setIsSettingsOpen(true)}
        onUnlockAchievement={handleUnlockAchievement}
        onSelectSession={handleSelectSession}
        onCreateNewSession={handleCreateNewSession}
        onDeleteSession={handleDeleteSession}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        memories={memories}
        onDeleteMemory={handleDeleteMemory}
      />
    </>
  );
};

export default App;