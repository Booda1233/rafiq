
import React, { useState, useEffect } from 'react';
import type { Message } from '../types';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageToEdit: Message | null;
  onConfirmEdit: (originalMessage: Message, modification: string) => Promise<void>;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, onClose, messageToEdit, onConfirmEdit }) => {
  const [modification, setModification] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTimeout(() => {
        setModification('');
        setIsEditing(false);
      }, 300); // Delay to allow for closing animation
    }
  }, [isOpen]);

  if (!isOpen || !messageToEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modification.trim() || isEditing) return;
    
    setIsEditing(true);
    await onConfirmEdit(messageToEdit, modification.trim());
    // The parent component will handle closing the modal and resetting state.
  };

  const imageSrc = `data:image/jpeg;base64,${messageToEdit.base64Image}`;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-edit-title"
    >
      <div 
        className="bg-[var(--bg-surface)]/80 backdrop-blur-2xl border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-2xl text-white transform transition-all animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <header className="p-4 md:p-6 border-b border-[var(--border-color)] flex-shrink-0">
            <h2 id="image-edit-title" className="text-xl md:text-2xl font-bold text-center">التعديل الإبداعي للصورة</h2>
            <p className="text-center text-sm text-[var(--text-secondary)] mt-1">صف التغيير الذي تريد إضافته على الصورة.</p>
        </header>

        <form onSubmit={handleSubmit}>
            <div className="p-4 md:p-6 flex-grow overflow-y-auto flex flex-col md:flex-row gap-4 md:gap-6 items-center">
                <div className="w-full md:w-1/2 flex-shrink-0">
                    <img src={imageSrc} alt="Image to edit" className="rounded-lg shadow-lg w-full aspect-square object-cover border border-white/10" />
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                    <div>
                        <label htmlFor="modification" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">ماذا تريد أن تعدل؟</label>
                        <textarea
                            id="modification"
                            value={modification}
                            onChange={(e) => setModification(e.target.value)}
                            placeholder="مثال: اجعل السماء تمطر، أضف قبعة على الشخص، غير النمط إلى كرتوني..."
                            className="w-full h-32 bg-[var(--bg-dark)] text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] focus:ring-[var(--primary-from)] transition border border-[var(--border-color)] resize-none"
                            required
                            disabled={isEditing}
                        />
                    </div>
                     <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-dark)]/50 p-2 rounded-md border border-[var(--border-color)]">
                        <p className="font-bold text-white">الوصف الأصلي للصورة:</p>
                        <p className="font-mono text-slate-400 truncate" dir="ltr">{messageToEdit.originalPrompt}</p>
                    </div>
                </div>
            </div>

            <footer className="flex items-center justify-end gap-4 bg-black/20 p-4 rounded-b-2xl border-t border-[var(--border-color)]">
                <button type="button" onClick={onClose} disabled={isEditing} className="py-2.5 px-6 rounded-xl bg-[var(--bg-surface-hover)] hover:bg-slate-600 transition-colors duration-200 font-semibold disabled:opacity-50">
                    إلغاء
                </button>
                <button type="submit" disabled={!modification.trim() || isEditing} className="py-2.5 px-6 rounded-xl bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] hover:shadow-lg hover:shadow-[var(--primary-from)]/30 font-semibold transition-all duration-200 disabled:from-slate-500 disabled:to-slate-600 disabled:cursor-not-allowed disabled:shadow-none w-40 flex items-center justify-center">
                    {isEditing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                          <span>جاري الإنشاء...</span>
                        </>
                    ) : (
                        "أنشئ الصورة"
                    )}
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};

export default ImageEditModal;