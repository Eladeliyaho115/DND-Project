import React from 'react';
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
  // הפעלת ה-Hook עם ה-campaignId המעודכן
  const {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    messagesEndRef,
  } = useGeminiChat(campaignId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 border-l border-amber-500/30 shadow-2xl backdrop-blur-md flex flex-col transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h3 className="text-lg font-bold text-amber-400">Gemini DM Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 p-1 text-lg rounded-lg hover:bg-slate-800 transition"
        >
          ✕
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                  : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-amber-400 border border-slate-700/60 rounded-2xl rounded-bl-none px-4 py-2 text-xs flex items-center gap-2">
              <span className="animate-spin">⏳</span> Gemini חושב...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-2 border-t border-slate-800/60 bg-slate-950/30 flex gap-2 overflow-x-auto text-[11px]">
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
        <input
          type="text"
          placeholder="שאל חוק, בקש רעיון ל-NPC..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
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
  );
};