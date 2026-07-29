import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGeminiChat } from '../../../hooks/useGeminiChat';

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
}

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  isOpen,
  onClose,
  campaignId,
}) => {
  const {
    sessions,
    currentSessionId,
    selectSession,
    handleCreateNewSession,
    handleDeleteSession,
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    triggerManualAISummary,
    messagesEndRef,
  } = useGeminiChat(campaignId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    /* 🟢 תוקן: הגדרת dir="rtl" כ-attribute רשמי של HTML במקום מחלקת CSS */
    <div 
      dir="rtl" 
      className="w-full h-full bg-slate-900/95 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-md flex flex-row transition-all overflow-hidden text-right"
    >
      
      {/* 🟢 Sidebar: רשימת השיחות */}
      <div
        className={`${
          isSidebarOpen ? 'w-64 border-l border-slate-800' : 'w-0'
        } transition-all duration-300 overflow-hidden bg-slate-950/80 flex flex-col justify-between`}
      >
        <div className="p-3">
          <button
            onClick={handleCreateNewSession}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2 mb-3 disabled:opacity-50"
          >
            <span>➕</span> שיחה חדשה
          </button>

          <div className="text-[11px] font-semibold text-slate-400 mb-2 px-1">שיחות קודמות</div>

          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                  s.id === currentSessionId
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate flex-1 pl-1">💬 {s.title}</span>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="text-slate-500 hover:text-red-400 text-xs p-1"
                  title="מחק שיחה"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔵 Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/80 rounded-lg text-xs transition"
              title="תפריט שיחות"
            >
              📑 שיחות ({sessions.length})
            </button>
            <span className="text-lg">✨</span>
            <h3 className="text-sm font-bold text-amber-400">Gemini DM Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 text-sm rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              {/* 🟢 תוקן: הוספת dir="auto" ו-text-right למעטפת ההודעות כדי להתמודד עם שפות מעורבות */}
              <div
                dir="auto"
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed text-right ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-bl-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-br-none prose prose-invert prose-xs max-w-none text-right [direction:inherit]'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-end">
              <div className="bg-slate-800 text-amber-400 border border-slate-700/60 rounded-2xl rounded-br-none px-4 py-2 text-xs flex items-center gap-2">
                <span className="animate-spin">⏳</span> Gemini חושב...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts & Actions */}
        <div className="p-2 border-t border-slate-800/60 bg-slate-950/30 flex gap-2 overflow-x-auto text-[11px]">
          <button
            onClick={triggerManualAISummary}
            disabled={loading}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-2.5 py-1 rounded-lg border border-amber-500/40 whitespace-nowrap transition flex items-center gap-1.5 disabled:opacity-50"
          >
            📜 סכם שיחה ל-PDF
          </button>

          <button
            onClick={() => sendMessage('איך עובד Grapple ב-5e?')}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300/80 px-2.5 py-1 rounded-lg border border-slate-700 whitespace-nowrap transition"
          >
            🥊 חוקי Grapple
          </button>
          <button
            onClick={() => sendMessage('תרגם ותאר מבוך עתיק ואפל ב-2 משפטים')}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300/80 px-2.5 py-1 rounded-lg border border-slate-700 whitespace-nowrap transition"
          >
            🏰 תיאור מבוך
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950/80 flex gap-2">
          {/* 🟢 תוקן: הוספת dir="auto" לשדה הקלט כדי שטקסט בעברית ובאנגלית יוקלד בכיוון הנכון */}
          <input
            type="text"
            dir="auto"
            placeholder="שאל חוק, בקש רעיון ל-NPC..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition text-right"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50"
          >
            שלח
          </button>
        </form>
      </div>
    </div>
  );
};