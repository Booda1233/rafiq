
import React, { useState, useEffect } from 'react';
import { UserSettings, Memory, AIGender, AchievementID } from '../types';
import { CloseIcon, TrashIcon, TrophyIcon } from './icons';
import { ALL_ACHIEVEMENTS } from '../achievements';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  memories: Memory[];
  onDeleteMemory: (id: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSaveSettings, memories, onDeleteMemory }) => {
  const [currentSettings, setCurrentSettings] = useState(settings);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(currentSettings);
    onClose();
  };
  
  const handleRequestNotificationPermission = () => {
    if (!("Notification" in window)) {
      alert("متصفحك لا يدعم الإشعارات.");
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setCurrentSettings(prev => ({ ...prev, notificationsEnabled: true }));
        } else {
           setCurrentSettings(prev => ({ ...prev, notificationsEnabled: false }));
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-[var(--surface-1)] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">الإعدادات</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><CloseIcon className="w-6 h-6"/></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto scroll-container">
          {/* User and AI Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسمك</label>
              <input type="text" id="userName" value={currentSettings.userName} onChange={e => setCurrentSettings({...currentSettings, userName: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-3 py-2 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none" />
            </div>
            <div>
              <label htmlFor="aiName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم الرفيق</label>
              <input type="text" id="aiName" value={currentSettings.aiName} onChange={e => setCurrentSettings({...currentSettings, aiName: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-3 py-2 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none" />
            </div>
          </div>
          
          {/* AI Gender */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">هوية الرفيق</label>
            <div className="flex bg-[var(--surface-2)] rounded-md p-1">
              {(Object.values(AIGender)).map(gender => (
                <button
                  key={gender}
                  onClick={() => setCurrentSettings(prev => ({...prev, aiGender: gender}))}
                  className={`w-1/2 rounded py-1.5 text-sm font-semibold transition-colors ${
                    currentSettings.aiGender === gender
                      ? 'bg-[var(--accent)] text-slate-900'
                      : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--border)]'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>
          
          {/* Notifications */}
          <div>
             <label className="block text-sm font-medium text-[var(--text-secondary)]">الإشعارات الدورية</label>
             <div className="flex items-center space-s-4 mt-2 p-3 bg-[var(--surface-2)] rounded-md">
                <input
                    type="checkbox"
                    id="notifications"
                    checked={currentSettings.notificationsEnabled}
                    onChange={(e) => {
                        if (e.target.checked) {
                            handleRequestNotificationPermission();
                        } else {
                            setCurrentSettings(prev => ({ ...prev, notificationsEnabled: false }));
                        }
                    }}
                    className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface-1)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <label htmlFor="notifications" className="text-[var(--text-primary)]">تفعيل الإشعارات للاطمئنان عليك (كل ساعتين)</label>
             </div>
          </div>
          
          {/* Achievements Section */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">الإنجازات</h3>
            <div className="bg-[var(--surface-2)] p-3 rounded-md max-h-56 overflow-y-auto scroll-container grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_ACHIEVEMENTS.map(achievement => {
                const isUnlocked = settings.unlockedAchievements.includes(achievement.id);
                const Icon = achievement.icon;
                return (
                  <div key={achievement.id} className={`p-3 rounded-md border ${isUnlocked ? 'border-amber-400/30 bg-amber-400/10' : 'border-[var(--border)] bg-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-8 h-8 flex-shrink-0 ${isUnlocked ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`} />
                      <div>
                        <p className={`font-bold ${isUnlocked ? 'text-amber-300' : 'text-[var(--text-primary)]'}`}>{achievement.title}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>


          {/* Memory Management */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">ذاكرة الرفيق</h3>
            <div className="bg-[var(--surface-2)] p-3 rounded-md max-h-48 overflow-y-auto scroll-container space-y-2">
              {memories.length > 0 ? memories.map(memory => (
                <div key={memory.id} className="flex justify-between items-center bg-[var(--border)] p-2 rounded">
                  <p className="text-sm text-[var(--text-primary)] flex-grow">{memory.content}</p>
                  <button onClick={() => onDeleteMemory(memory.id)} className="text-red-500 hover:text-red-400 p-1">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )) : (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">الذاكرة فارغة حاليًا.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end">
          <button onClick={handleSave} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-slate-900 font-bold py-2 px-6 rounded-md transition-colors duration-200">
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
