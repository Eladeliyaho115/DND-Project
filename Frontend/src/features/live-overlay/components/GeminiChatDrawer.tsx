import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGeminiChat } from '../../../hooks/useGeminiChat';

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  onHpChange?: (changeAmount: number, characterName?: string) => void;
}

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  isOpen,
  onClose,
  campaignId,
  onHpChange,
}) => {
  const {
    sessions,
    currentSessionId,
    selectSession,
    handleCreateNewSession,
    handleDeleteSession,
    handleUpdateSessionTitle,
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    editLastUserMessage,
    triggerManualAISummary,
    messagesEndRef,
  } = useGeminiChat(campaignId, (stateUpdates) => {
    if (stateUpdates?.hpChanges && onHpChange) {
      stateUpdates.hpChanges.forEach((change) => {
        onHpChange(change.changeAmount, change.characterName);
      });
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEditClick = () => {
    if (loading) return;
    editLastUserMessage();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const startEditingSession = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const saveSessionTitle = (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim() && handleUpdateSessionTitle) {
      handleUpdateSessionTitle(sessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const lastUserMessageIndex = messages.findLastIndex((m) => m.sender === 'user');

  return (
    <div 
      dir="rtl" 
      className="w-full h-full bg-slate-950/90 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-row overflow-hidden text-right select-text font-sans relative"
    >
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64 border-l border-slate-800/80 opacity-100' : 'w-0 opacity-0'
        } transition-all duration-300 ease-in-out overflow-hidden bg-slate-950/95 flex flex-col justify-between select-none z-20`}
      >
        <div className="p-3">
          <button
            onClick={() => {
              handleCreateNewSession();
              setIsSidebarOpen(false);
            }}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition-all duration-200 shadow-md hover:shadow-amber-500/20 flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
          >
            <span>✨</span> שיחה חדשה
          </button>

          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2 px-1">
            סשנים ושיחות
          </div>

          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-0.5">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  selectSession(s.id);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                  s.id === currentSessionId
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {editingSessionId === s.id ? (
                  <form onSubmit={(e) => saveSessionTitle(s.id, e)} className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      autoFocus
                      onBlur={() => saveSessionTitle(s.id)}
                      className="w-full bg-slate-900 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-amber-200 focus:outline-none"
                    />
                  </form>
                ) : (
                  <>
                    <span className="truncate flex-1 pl-1">🎲 {s.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditingSession(s.id, s.title, e)}
                        className="text-slate-400 hover:text-amber-300 text-xs p-1"
                        title="ערוך שם"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="text-slate-500 hover:text-rose-400 text-xs p-1"
                        title="מחק שיחה"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div 
        className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/40"
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
      >
        <div className="p-3.5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/70 backdrop-blur-md select-none">
          <div className="flex items-center gap-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSidebarOpen(!isSidebarOpen);
              }}
              className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs transition flex items-center gap-1.5"
              title="תפריט שיחות"
            >
              <span>📑</span>
              <span className="font-semibold">{sessions.length}</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />
            <div className="flex items-center gap-2">
              <span className="text-base animate-pulse">🐉</span>
              <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                Dungeon Master Assistant
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 text-sm rounded-xl hover:bg-slate-800/80 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 select-text scrollbar-thin scrollbar-thumb-slate-800">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <span className="text-3xl mb-2">🐉</span>
              <p className="text-xs text-slate-400">מה נפתח בשיחה הזו, שליט המבוך?</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isLastUserMessage = i === lastUserMessageIndex && msg.sender === 'user';

            return (
              <div
                key={i}
                className={`flex flex-col group ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {msg.sender === 'user' ? '👤 אתה' : '🐉 Dungeon Master'}
                  </span>

                  {isLastUserMessage && !loading && (
                    <button
                      onClick={handleEditClick}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-400 hover:text-amber-300 transition flex items-center gap-0.5"
                      title="ערוך הודעה אחרונה"
                    >
                      <span>✏️</span>
                      <span>ערוך</span>
                    </button>
                  )}
                </div>

                <div
                  dir="auto"
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed transition-all shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-amber-500/5'
                      : 'bg-slate-950/80 text-slate-100 border border-slate-800/80 rounded-tl-none shadow-slate-950/40 prose prose-invert prose-xs max-w-none prose-p:leading-relaxed'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                  ) : (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 mb-1 px-1 font-mono">🐉 Dungeon Master</span>
              <div className="bg-slate-950/80 text-amber-400 border border-amber-500/20 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 shadow-lg">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-300">ה-DM חושב ומנסח תשובה...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-3 py-2 border-t border-slate-800/50 bg-slate-950/40 flex gap-2 overflow-x-auto text-[11px] select-none no-scrollbar">
          <button
            onClick={triggerManualAISummary}
            disabled={loading}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold px-3 py-1.5 rounded-xl border border-amber-500/30 whitespace-nowrap transition flex items-center gap-1.5 disabled:opacity-50"
          >
            📜 סכם שיחה ל-PDF
          </button>
          <button
            onClick={() => sendMessage('תן לי סיכום קצר, תכונות ומראה עבור דמות בקמפיין')}
            className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-amber-300 px-3 py-1.5 rounded-xl border border-slate-700/50 whitespace-nowrap transition"
          >
            👤 סיכום דמות
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800/80 bg-slate-950/90 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            dir="auto"
            placeholder="(Enter לשליחה, Shift+Enter לשורה חדשה)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition text-right select-text resize-none max-h-32 scrollbar-thin"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            title="שלח הודעה"
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold w-[38px] h-[38px] rounded-xl text-xs transition-all duration-150 disabled:opacity-30 select-none flex items-center justify-center shadow-md hover:shadow-amber-500/20 shrink-0 group"
          >
            <svg 
              className="w-4 h-4 transform -rotate-45 -translate-y-0.5 translate-x-0.5 group-hover:scale-110 transition-transform" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};