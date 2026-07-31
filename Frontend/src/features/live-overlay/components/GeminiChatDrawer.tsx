import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGeminiChat } from '../../../hooks/useGeminiChat';
import styles from './../../../styles/GeminiChatDrawer.module.css';

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
    <div className={styles.chatContainer}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarContent}>
          {/* כפתור שיחה חדשה */}
          <button
            onClick={() => {
              handleCreateNewSession();
              setIsSidebarOpen(false);
            }}
            disabled={loading}
            className={styles.newChatBtn}
          >
            <span>✨</span> שיחה חדשה
          </button>

          {/* קטגוריה: פרומפטים ופעולות מהירות */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionHeader}>
              <span>💡</span> עזרה ופרומפטים
            </div>
            <div className={styles.promptsList}>
              <button
                onClick={triggerManualAISummary}
                disabled={loading}
                className={styles.promptBtn}
              >
                <span>📜</span> סכם שיחה ל-PDF
              </button>
              <button
                onClick={() => {
                  sendMessage('תן לי סיכום קצר, תכונות ומראה עבור דמות בקמפיין');
                  setIsSidebarOpen(false);
                }}
                className={styles.promptBtn}
              >
                <span>👤</span> סיכום דמות
              </button>
              <button
                onClick={() => {
                  sendMessage('צור לי רעיון למפגש קרב מעניין (Encounter) לרמה הנוכחית');
                  setIsSidebarOpen(false);
                }}
                className={styles.promptBtn}
              >
                <span>⚔️</span> רעיון למפגש קרב
              </button>
            </div>
          </div>

          <hr className={styles.sidebarDivider} />

          {/* קטגוריה: שיחות אחרונות */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionHeader}>
              <span>💬</span> שיחות אחרונות
            </div>
            <div className={styles.sessionsList}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    selectSession(s.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`${styles.sessionItem} ${
                    s.id === currentSessionId ? styles.sessionActive : styles.sessionInactive
                  }`}
                >
                  {editingSessionId === s.id ? (
                    <form
                      onSubmit={(e) => saveSessionTitle(s.id, e)}
                      className="flex-1 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        autoFocus
                        onBlur={() => saveSessionTitle(s.id)}
                        className={styles.sessionTitleInput}
                      />
                    </form>
                  ) : (
                    <>
                      <span className="truncate flex-1 pl-1">🎲 {s.title}</span>
                      <div className={styles.sessionActions}>
                        <button
                          onClick={(e) => startEditingSession(s.id, s.title, e)}
                          className={styles.sessionActionBtn}
                          title="ערוך שם"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className={`${styles.sessionActionBtn} ${styles.sessionDeleteBtn}`}
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
      </div>

      {/* Main Chat Area */}
      <div 
        className={styles.mainChatBody}
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
      >
        <div className={styles.chatHeader}>
          <div className={styles.headerLeftGroup}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSidebarOpen(!isSidebarOpen);
              }}
              className={styles.sidebarToggleBtn}
              title="תפריט שיחות"
            >
              <span>📑</span>
              <span className="font-semibold">{sessions.length}</span>
            </button>
            <div className={styles.headerDivider} />
            <div className={styles.headerTitleWrapper}>
              <span className={styles.headerIcon}>🐉</span>
              <h3 className={styles.headerTitle}>
                Dungeon Master Assistant
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.closeChatBtn}
          >
            ✕
          </button>
        </div>

        <div className={styles.messagesContainer}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🐉</span>
              <p className={styles.emptyText}>מה נפתח בשיחה הזו, שליט המבוך?</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isLastUserMessage = i === lastUserMessageIndex && msg.sender === 'user';

            return (
              <div
                key={i}
                className={`${styles.messageRow} ${
                  msg.sender === 'user' ? styles.userMessageRow : styles.dmMessageRow
                }`}
              >
                <div className={styles.messageMeta}>
                  <span className={styles.messageSenderLabel}>
                    {msg.sender === 'user' ? '👤 אתה' : '🐉 Dungeon Master'}
                  </span>

                  {isLastUserMessage && !loading && (
                    <button
                      onClick={handleEditClick}
                      className={styles.editMsgBtn}
                      title="ערוך הודעה אחרונה"
                    >
                      <span>✏️</span>
                      <span>ערוך</span>
                    </button>
                  )}
                </div>

                <div
                  dir="auto"
                  className={`${styles.messageBubble} ${
                    msg.sender === 'user' ? styles.userBubble : styles.dmBubble
                  } ${msg.sender !== 'user' ? 'prose prose-invert prose-xs max-w-none prose-p:leading-relaxed' : ''}`}
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
            <div className={styles.typingIndicatorRow}>
              <span className={styles.messageMeta}>🐉 Dungeon Master</span>
              <div className={styles.typingBubble}>
                <span className={styles.typingDot} />
                <span className={styles.typingText}>ה-DM חושב ומנסח תשובה...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <textarea
            ref={textareaRef}
            rows={1}
            dir="auto"
            placeholder="(Enter לשליחה, Shift+Enter לשורה חדשה)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.chatTextarea}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            title="שלח הודעה"
            className={styles.sendBtn}
          >
            <svg 
              className={styles.sendIcon} 
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