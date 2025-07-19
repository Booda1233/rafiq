

import React, { useState, useEffect } from 'react';
import type { UserData } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newUserData: UserData, options?: { closeModal: boolean }) => void;
  userData: UserData;
}

const BackgroundOption: React.FC<{
    label: string;
    value: string;
    previewClass: string;
    isSelected: boolean;
    onClick: (value: string) => void;
}> = ({ label, value, previewClass, isSelected, onClick }) => {
    return (
        <button
            onClick={() => onClick(value)}
            className={`w-full p-2 rounded-xl transition-all duration-200 border-2 ${isSelected ? 'border-[var(--primary-from)] shadow-lg shadow-[var(--primary-from)]/20' : 'border-transparent hover:border-[var(--border-color)]'}`}
        >
            <div className={`w-full h-20 rounded-lg ${previewClass} border border-[var(--border-color)] overflow-hidden`}></div>
            <p className={`mt-2 font-semibold text-sm ${isSelected ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{label}</p>
        </button>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, userData }) => {
  const [currentUserName, setCurrentUserName] = useState(userData.userName);
  const [currentAiName, setCurrentAiName] = useState(userData.aiName);
  const [currentMemory, setCurrentMemory] = useState<string[]>(userData.memory || []);
  const [activeTab, setActiveTab] = useState<'general' | 'memory' | 'appearance'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(userData.notificationsEnabled || false);
  const [currentChatBackground, setCurrentChatBackground] = useState(userData.chatBackground || 'neon_nexus');

  useEffect(() => {
    if (isOpen) {
        setCurrentUserName(userData.userName);
        setCurrentAiName(userData.aiName);
        setCurrentMemory(userData.memory || []);
        setNotificationsEnabled(userData.notificationsEnabled || false);
        setCurrentChatBackground(userData.chatBackground || 'neon_nexus');
        setActiveTab('general');
    }
  }, [isOpen, userData]);

  if (!isOpen) return null;

  const showTestNotification = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const aiName = currentAiName.trim() || userData.aiName;
        const testNotificationOptions: NotificationOptions = {
            body: `ممتاز! تم تفعيل الإشعارات بنجاح. سأطمئن عليك لاحقًا. 👋`,
            icon: `https://api.dicebear.com/8.x/micah/svg?seed=${aiName}`,
            tag: 'test-notification',
            dir: 'rtl'
        };
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(`مرحباً من ${aiName}`, testNotificationOptions);
        });
    }
  };

  const handleNotificationsToggle = async () => {
    const newState = !notificationsEnabled;
    if (newState) { // If turning on
        if (Notification.permission === 'denied') {
            alert('تم رفض إذن الإشعارات سابقًا. يرجى تمكينها من إعدادات المتصفح.');
            return;
        }
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setNotificationsEnabled(true);
                onSave({ ...userData, notificationsEnabled: true, chatBackground: currentChatBackground }, { closeModal: false });
                showTestNotification();
            }
        } else {
             setNotificationsEnabled(true);
             onSave({ ...userData, notificationsEnabled: true, chatBackground: currentChatBackground }, { closeModal: false });
             showTestNotification();
        }
    } else { // If turning off
        setNotificationsEnabled(false);
        onSave({ ...userData, notificationsEnabled: false, chatBackground: currentChatBackground }, { closeModal: false });
    }
  };

  const handleSave = () => {
    if (currentUserName.trim() && currentAiName.trim()) {
      setIsSaving(true);
      const newUserData: UserData = {
        ...userData,
        userName: currentUserName.trim(),
        aiName: currentAiName.trim(),
        userAvatar: userData.userAvatar, 
        aiAvatar: userData.aiAvatar,
        memory: currentMemory,
        notificationsEnabled: notificationsEnabled,
        chatBackground: currentChatBackground,
      };
      setTimeout(() => {
          onSave(newUserData, { closeModal: true });
          setIsSaving(false);
      }, 500);
    }
  };

  const handleDeleteMemory = (factToDelete: string) => {
    setCurrentMemory(currentMemory.filter(fact => fact !== factToDelete));
  };

  const canSave = currentUserName.trim() !== '' && currentAiName.trim() !== '' && !isSaving;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start pt-16 p-4 transition-opacity animate-in fade-in duration-300 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-[var(--bg-surface)]/80 backdrop-blur-2xl border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg text-white transform transition-all animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-6 md:p-8">
            <h2 id="settings-title" className="text-2xl font-bold mb-6 text-center">الإعدادات</h2>
            
            <div className="bg-[var(--bg-dark)]/50 p-1.5 rounded-2xl mb-6">
                <nav className="flex">
                    <button onClick={() => setActiveTab('general')} className={`w-1/3 py-2.5 px-1 text-center rounded-xl font-medium text-sm transition-colors ${activeTab === 'general' ? 'bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] text-white shadow-md shadow-[var(--primary-from)]/20' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                        عام
                    </button>
                    <button onClick={() => setActiveTab('memory')} className={`w-1/3 py-2.5 px-1 text-center rounded-xl font-medium text-sm transition-colors ${activeTab === 'memory' ? 'bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] text-white shadow-md shadow-[var(--primary-from)]/20' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                        الذاكرة
                    </button>
                    <button onClick={() => setActiveTab('appearance')} className={`w-1/3 py-2.5 px-1 text-center rounded-xl font-medium text-sm transition-colors ${activeTab === 'appearance' ? 'bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] text-white shadow-md shadow-[var(--primary-from)]/20' : 'text-[var(--text-secondary)] hover:text-white'}`}>
                        المظهر
                    </button>
                </nav>
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                        <label htmlFor="userName" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">اسمك</label>
                        <input id="userName" type="text" value={currentUserName} onChange={(e) => setCurrentUserName(e.target.value)} className="w-full bg-[var(--bg-dark)] text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] focus:ring-[var(--primary-from)] transition border border-[var(--border-color)] placeholder:text-[var(--text-secondary)]" autoComplete="off"/>
                    </div>
                    <div>
                        <label htmlFor="aiName" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">اسم صديقك</label>
                        <input id="aiName" type="text" value={currentAiName} onChange={(e) => setCurrentAiName(e.target.value)} className="w-full bg-[var(--bg-dark)] text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] focus:ring-[var(--primary-from)] transition border border-[var(--border-color)] placeholder:text-[var(--text-secondary)]" autoComplete="off" />
                    </div>
                    
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">الإشعارات</label>
                        <div className="p-4 rounded-xl border-2 flex justify-between items-center bg-[var(--bg-dark)]/50 border-[var(--border-color)]">
                            <div>
                                <h4 className="font-bold text-white">إشعارات دورية</h4>
                                <p className="text-sm text-[var(--text-secondary)]">اسمح لصديقك بالاطمئنان عليك من وقت لآخر.</p>
                            </div>
                            <button onClick={handleNotificationsToggle} aria-pressed={notificationsEnabled} className={`relative inline-flex items-center h-8 w-14 rounded-full p-1 cursor-pointer transition-colors duration-300 ${notificationsEnabled ? 'bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)]' : 'bg-slate-600'}`}>
                                <span className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-6' : ''}`}></span>
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] px-1 mt-2">
                            بعد التفعيل، سيقوم صديقك بإرسال رسالة لك كل ساعتين تقريبًا للاطمئنان عليك.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'memory' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                     <p className="text-sm text-[var(--text-secondary)] mb-4">هذه هي قائمة بالحقائق التي تعلمها صديقك عنك. يمكنك حذف أي منها.</p>
                     {currentMemory.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 -mr-2">
                            {currentMemory.map((fact, index) => (
                                <div key={index} className="flex items-center justify-between bg-[var(--bg-dark)]/50 p-3 rounded-lg group">
                                    <p className="text-white text-sm">{fact}</p>
                                    <button onClick={() => handleDeleteMemory(fact)} className="text-slate-500 hover:text-[var(--danger)] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20" aria-label={`حذف الذاكرة: ${fact}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-8">
                            <p className="text-[var(--text-secondary)]">الذاكرة فارغة حالياً.</p>
                        </div>
                     )}
                </div>
            )}

            {activeTab === 'appearance' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-4">خلفية المحادثة</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       <BackgroundOption 
                         label="روابط نيوني"
                         value="neon_nexus"
                         previewClass="bg-neon-nexus"
                         isSelected={currentChatBackground === 'neon_nexus'}
                         onClick={setCurrentChatBackground}
                       />
                       <BackgroundOption 
                         label="تيار البيانات"
                         value="data_stream"
                         previewClass="bg-data-stream"
                         isSelected={currentChatBackground === 'data_stream'}
                         onClick={setCurrentChatBackground}
                       />
                       <BackgroundOption 
                         label="شبكة هولوغرافية"
                         value="holo_grid"
                         previewClass="bg-holo-grid"
                         isSelected={currentChatBackground === 'holo_grid'}
                         onClick={setCurrentChatBackground}
                       />
                       <BackgroundOption 
                         label="الشبكة السيبرانية"
                         value="cyber_grid"
                         previewClass="bg-cyber-grid"
                         isSelected={currentChatBackground === 'cyber_grid'}
                         onClick={setCurrentChatBackground}
                       />
                       <BackgroundOption 
                         label="داكن"
                         value="solid"
                         previewClass="bg-solid"
                         isSelected={currentChatBackground === 'solid'}
                         onClick={setCurrentChatBackground}
                       />
                    </div>
                </div>
            )}
        </div>
        
        <div className="flex items-center justify-end gap-4 mt-4 bg-black/20 p-4 rounded-b-2xl border-t border-[var(--border-color)]">
          <button onClick={onClose} className="py-2.5 px-6 rounded-xl bg-[var(--bg-surface-hover)] hover:bg-slate-600 transition-colors duration-200 font-semibold">
            إلغاء
          </button>
          <button onClick={handleSave} disabled={!canSave} className="py-2.5 px-6 rounded-xl bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] hover:shadow-lg hover:shadow-[var(--primary-from)]/30 font-semibold transition-all duration-200 disabled:from-slate-500 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
            {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;