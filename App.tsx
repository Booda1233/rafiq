import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from "@google/genai";
import { startChat } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import SettingsModal from './components/SettingsModal';
import ConversationHistoryPanel from './components/ConversationHistoryPanel';
import { fileToBase64 } from './utils';
import type { Message, UserData, Conversation } from './types';

// --- Helper Components ---

const SplashScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white animate-in fade-in duration-500">
        <div className="relative w-32 h-32 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-40"></div>
             <svg className="w-24 h-24 text-white z-10 drop-shadow-[0_0_15px_rgba(100,180,255,0.5)]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.999 2H10C8.897 2 8 2.897 8 4V12C8 13.103 8.897 14 10 14H15.172L19 17.828V14H20C21.103 14 22 13.103 22 12V4C21.999 2.897 21.103 2 19.999 2Z"></path>
                <path d="M6 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18H8.828L13 22.172V18H14C15.103 18 16 17.103 16 16V14H14V16H4V8H6V6Z"></path>
            </svg>
        </div>
        <p className="text-slate-400 mt-8 text-lg font-semibold tracking-wider">جاري تجهيز صديقك...</p>
    </div>
);


const SetupScreen: React.FC<{ onSetupComplete: (data: UserData) => void }> = ({ onSetupComplete }) => {
  const [userName, setUserName] = useState('');
  const [aiName, setAiName] = useState('كريم');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && aiName.trim()) {
      onSetupComplete({
        userName: userName.trim(),
        aiName: aiName.trim(),
        userAvatar: `https://api.dicebear.com/8.x/adventurer/svg?seed=${userName.trim()}`,
        aiAvatar: `https://api.dicebear.com/8.x/adventurer/svg?seed=${aiName.trim()}`,
      });
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-800 border border-white/10 p-8 rounded-xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold mb-2">أهلاً بك!</h1>
        <p className="text-slate-400 mb-8">لنبني صداقتنا. كيف يمكنني أن أناديك؟ وماذا ستناديني؟</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="اكتب اسمك هنا..."
            className="w-full bg-slate-900/50 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition border border-slate-600 focus:border-blue-500"
            required
          />
          <input
            type="text"
            value={aiName}
            onChange={(e) => setAiName(e.target.value)}
            placeholder="اختر اسمًا لصديقك..."
            className="w-full bg-slate-900/50 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition border border-slate-600 focus:border-blue-500"
            required
          />
          <button 
            type="submit" 
            className="w-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
          >
            لنبدأ الدردشة
          </button>
        </form>
      </div>
    </div>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [appState, setAppState] = useState<'LOADING' | 'SETUP' | 'CHAT'>('LOADING');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const chatAreaRef = useRef<HTMLDivElement | null>(null);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages ?? [];
  const userData = activeConversation?.userData;

  // Effect for initialization and routing
  useEffect(() => {
    setTimeout(() => {
      try {
        const storedConversations = localStorage.getItem('conversations');
        if (storedConversations) {
          const loadedConversations: Conversation[] = JSON.parse(storedConversations);
          if (loadedConversations.length > 0) {
            setConversations(loadedConversations);
            const latest = loadedConversations.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
            setActiveConversationId(latest.id);
            chatRef.current = startChat(latest.userData.aiName, latest.messages);
            setAppState('CHAT');
          } else {
             setAppState('SETUP');
          }
        } else {
          // Migration from old version
          const oldUserData = localStorage.getItem('userData');
          const oldChatHistory = localStorage.getItem('chatHistory');
          if (oldUserData && oldChatHistory) {
            const userData: UserData = JSON.parse(oldUserData);
            const messages: Message[] = JSON.parse(oldChatHistory);
            const newConversation: Conversation = {
              id: `convo-${Date.now()}`,
              title: "محادثة سابقة",
              messages: messages.map(m => ({ ...m, id: m.id || `${m.sender}-${Date.now()}`})),
              userData: userData,
              lastUpdated: Date.now()
            };
            setConversations([newConversation]);
            setActiveConversationId(newConversation.id);
            chatRef.current = startChat(newConversation.userData.aiName, newConversation.messages);
            localStorage.setItem('conversations', JSON.stringify([newConversation]));
            localStorage.removeItem('userData');
            localStorage.removeItem('chatHistory');
            setAppState('CHAT');
          } else {
            setAppState('SETUP');
          }
        }
      } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.clear();
        setAppState('SETUP');
      }
    }, 1500);
  }, []);
  
  // Effect for saving conversations
  useEffect(() => {
    if (appState === 'CHAT' && conversations.length > 0) {
      try {
        const conversationsToStore = conversations.map(convo => ({
            ...convo,
            messages: convo.messages.map(({ imageUrl, base64Image, mimeType, ...rest }) => rest),
        }));
        localStorage.setItem('conversations', JSON.stringify(conversationsToStore));
      } catch (error) {
        console.error("Failed to save conversations", error);
      }
    }
  }, [conversations, appState]);
  
  // Effect for auto-scrolling
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSetupComplete = (data: UserData) => {
    const newId = `convo-${Date.now()}`;
    const newConversation: Conversation = {
        id: newId,
        title: `محادثة مع ${data.aiName}`,
        messages: [{ id: 'init', text: `أهلاً يا ${data.userName}! أنا ${data.aiName}، متشوق جداً لمحادثتنا! 😄`, sender: 'ai' }],
        userData: data,
        lastUpdated: Date.now()
    };
    
    setConversations([newConversation]);
    setActiveConversationId(newId);
    chatRef.current = startChat(data.aiName, []);
    setAppState('CHAT');
  };

  const handleSaveSettings = (newUserData: UserData) => {
    if (!activeConversationId) return;

    const needsChatReset = userData?.aiName !== newUserData.aiName;

    setConversations(prev => prev.map(c => {
        if (c.id === activeConversationId) {
            if(needsChatReset) {
                chatRef.current = startChat(newUserData.aiName, c.messages);
            }
            return { ...c, userData: newUserData, lastUpdated: Date.now() };
        }
        return c;
    }));
    
    setIsSettingsOpen(false);
  };
  
  const handleSelectConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if(conversation) {
        setActiveConversationId(id);
        chatRef.current = startChat(conversation.userData.aiName, conversation.messages);
        setIsSidebarOpen(false);
    }
  };
  
  const handleNewChat = () => {
    if (!userData) return; 
    const newId = `convo-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: "محادثة جديدة",
      messages: [{ id: 'init', text: `أهلاً يا ${userData.userName}! أنا ${userData.aiName}، مستعد لبدء محادثة جديدة!`, sender: 'ai' }],
      userData: userData,
      lastUpdated: Date.now()
    };
    setConversations(prev => [newConversation, ...prev.sort((a,b) => b.lastUpdated - a.lastUpdated)]);
    setActiveConversationId(newId);
    chatRef.current = startChat(userData.aiName, []);
    setIsSidebarOpen(false);
  };
  
  const handleDeleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    
    if(activeConversationId === id) {
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

  const updateConversation = (id: string, updates: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates, lastUpdated: Date.now() } : c));
  };

  const addMessageToConversation = (id: string, message: Message) => {
     setConversations(prev => prev.map(c => {
        if (c.id === id) {
            return { ...c, messages: [...c.messages, message], lastUpdated: Date.now() };
        }
        return c;
    }));
  };
  
  const updateLastMessageInConversation = (id: string, text: string) => {
      setConversations(prev => prev.map(c => {
        if (c.id === id) {
            const newMessages = [...c.messages];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1].text = text;
            }
            return { ...c, messages: newMessages, lastUpdated: Date.now() };
        }
        return c;
    }));
  }

  const handleSendMessage = async (userInput: string, imageFile?: File) => {
    if (!chatRef.current || isLoading || !activeConversationId || (!userInput && !imageFile)) return;

    setIsLoading(true);

    let base64Image: string | undefined;
    let mimeType: string | undefined;
    let imageUrl: string | undefined;

    if (imageFile) {
        try {
            base64Image = await fileToBase64(imageFile);
            mimeType = imageFile.type;
            imageUrl = URL.createObjectURL(imageFile);
        } catch (error) {
            console.error("Error converting file:", error);
            setIsLoading(false);
            return;
        }
    }
    
    const userMessage: Message = { 
        id: `user-${Date.now()}`, 
        text: userInput, 
        sender: 'user', 
        imageUrl,
        base64Image,
        mimeType,
    };
    addMessageToConversation(activeConversationId, userMessage);
    
    if (activeConversation?.messages.length < 3 && userInput) {
       updateConversation(activeConversationId, { title: userInput.substring(0, 40) + (userInput.length > 40 ? '...' : '') });
    }

    try {
        const messageParts = [];
        if (userInput) messageParts.push({ text: userInput });
        if (base64Image && mimeType) {
            messageParts.push({ inlineData: { data: base64Image, mimeType } });
        }

        const stream = await chatRef.current.sendMessageStream({ message: messageParts });
      
        let aiResponse = '';
        let aiMessageId: string | null = null;
        let isFirstChunk = true;
      
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            aiResponse += chunkText;

            if(isFirstChunk) {
                isFirstChunk = false;
                aiMessageId = `ai-${Date.now()}`;
                addMessageToConversation(activeConversationId, { id: aiMessageId, text: aiResponse, sender: 'ai' });
            } else if (aiMessageId) {
                updateLastMessageInConversation(activeConversationId, aiResponse);
            }
        }

    } catch (error) {
        console.error("Error sending message:", error);
        addMessageToConversation(activeConversationId, { 
            id: `error-${Date.now()}`, 
            text: "معلش يا صاحبي، شكلي مش مركز دلوقتي. ممكن تجرب تاني كمان شوية؟", 
            sender: 'ai' 
        });
    } finally {
        setIsLoading(false);
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl); // Clean up
        }
    }
  };

  if (appState === 'LOADING') {
    return <SplashScreen />;
  }

  if (appState === 'SETUP' || !userData || !activeConversation) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-slate-900 text-white md:max-w-4xl md:mx-auto md:border-x md:border-white/5 md:shadow-2xl md:shadow-black" dir="rtl">
        <Header 
            aiName={userData.aiName} 
            aiAvatar={userData.aiAvatar}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen(true)} 
        />
        <main ref={chatAreaRef} className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} avatar={msg.sender === 'ai' ? userData.aiAvatar : userData.userAvatar} />
          ))}
          {isLoading && <TypingIndicator />}
        </main>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
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
    </>
  );
};

export default App;