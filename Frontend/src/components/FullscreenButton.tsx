import { useState, useEffect } from 'react';

interface FullscreenButtonProps {
  className?: string; // 👈 מאפשר לדרוס או להוסיף סגנונות מבחוץ
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ className }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };

  // ברירת מחדל: fixed בפינה. אם מועבר className מבחוץ, משתמשים בו.
  const defaultClasses = "fixed bottom-20 lg:bottom-4 right-4 z-50 bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-amber-500/30 p-2.5 rounded-xl backdrop-blur-md shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center group";

  return (
    <button
      onClick={toggleFullscreen}
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      className={className || defaultClasses}
    >
      {isFullscreen ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      )}
    </button>
  );
};