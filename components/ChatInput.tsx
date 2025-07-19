
import React, { useState, useRef, useEffect } from 'react';

// --- Web Speech API Type Definitions ---
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
  
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
  
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
  
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: any;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
  
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    stop(): void;
    start(): void;
    abort(): void;
}
  
declare global {
    interface Window {
      SpeechRecognition: new () => SpeechRecognition;
      webkitSpeechRecognition: new () => SpeechRecognition;
    }
}


interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, inputValue, setInputValue }) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef(''); // Ref to hold the latest transcript


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false; // Stop when user stops talking
    recognition.interimResults = true;
    recognition.lang = 'ar-EG';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const fullTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      transcriptRef.current = fullTranscript;
      setInputValue(fullTranscript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Use the ref to get the latest transcript, as state update might be async
      const finalTranscript = transcriptRef.current.trim();
      if (finalTranscript) {
        onSendMessage(finalTranscript);
        // App.tsx's handleSendMessage will clear the input value state
        transcriptRef.current = ''; // Reset ref
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      transcriptRef.current = ''; // Reset ref on error
    };

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
    };
  }, [setInputValue, onSendMessage]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      // onend will handle the rest
    } else {
      // Clear previous text and start fresh
      setInputValue(''); 
      transcriptRef.current = '';
      removeFile();
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null); // No preview for non-image files
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    if(filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputValue.trim() || file) && !isLoading && !isRecording) {
      onSendMessage(inputValue.trim(), file ?? undefined);
      setInputValue('');
      removeFile();
    }
  };
  
  const isImageFile = file?.type.startsWith('image/');

  return (
    <div className="bg-gradient-to-t from-[var(--bg-dark)] via-[var(--bg-dark)] to-transparent p-2 sm:p-4 flex-shrink-0">
      {file && (
        <div className="relative w-full max-w-xs mb-3 p-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)] flex items-center gap-3">
          {isImageFile && filePreview ? (
             <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 bg-[var(--bg-dark)] rounded-lg flex items-center justify-center flex-shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
            </div>
          )}
          <div className="overflow-hidden flex-grow">
            <p className="text-sm font-semibold text-white truncate">{file.name}</p>
            <p className="text-xs text-[var(--text-secondary)]">{file.type}</p>
          </div>
          <button
            onClick={removeFile}
            className="absolute -top-2 -right-2 bg-[var(--danger)] text-white rounded-full w-7 h-7 flex items-center justify-center border-2 border-[var(--bg-dark)] hover:brightness-125 transition-all flex-shrink-0"
            aria-label="Remove file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
        <div className="flex-grow relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isRecording ? "جاري الاستماع..." : "اكتب رسالتك هنا..."}
              className="w-full bg-[var(--bg-surface)] text-white rounded-full py-3 pl-28 pr-5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)] focus:ring-[var(--primary-from)] transition duration-300 border border-transparent h-12 placeholder:text-[var(--text-secondary)]"
              disabled={isLoading || isRecording}
              autoComplete="off"
            />
             <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center">
                <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full bg-transparent text-[var(--text-secondary)] flex items-center justify-center shrink-0 hover:text-white transition-colors duration-200 hover:bg-[var(--bg-surface-hover)]"
                aria-label="Attach file"
                disabled={isRecording}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 106 0V7a1 1 0 112 0v4a5 5 0 11-10 0V7a3 3 0 013-3z" clipRule="evenodd" />
                    </svg>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isRecording}
                />
                {recognitionRef.current && (
                    <button
                        type="button"
                        onClick={toggleRecording}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${isRecording ? 'text-[var(--danger)] bg-[var(--danger)]/20' : 'text-[var(--text-secondary)] bg-transparent hover:text-white hover:bg-[var(--bg-surface-hover)]'}`}
                        aria-label={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 18.75a6 6 0 0 0 6-6v-1.5a6 6 0 0 0-12 0v1.5a6 6 0 0 0 6 6Z" />
                            <path d="M12 21.75a2.25 2.25 0 0 1-2.25-2.25v-1.876a6.002 6.002 0 0 0 4.5 0v1.876a2.25 2.25 0 0 1-2.25 2.25Z" />
                        </svg>
                    </button>
                )}
             </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || isRecording || (!inputValue.trim() && !file)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] text-white flex items-center justify-center shrink-0 disabled:from-slate-500 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--primary-from)]/30 transition-all duration-200 hover:scale-105"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 -mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
