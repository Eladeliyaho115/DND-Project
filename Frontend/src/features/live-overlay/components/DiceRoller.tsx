import React, { useEffect, useRef, useState } from "react";
import DiceBox from "@3d-dice/dice-box/dist/dice-box.es.js";

interface DiceRollerProps {
  triggerRoll?: string | null;
  onRollEnd?: (result: number) => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  triggerRoll,
  onRollEnd,
}) => {
  const diceBoxRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false); // 👈 דגל למעקב אחרי מצב הגלגול

  useEffect(() => {
    const diceBox = new DiceBox({
      container: "#dice-box",
      assetPath: "/assets/dice-box/",
      scale: 18,
      theme: "default",
      themeColor: "#f59e0b",
      
      // 🎬 פיזיקה איטית ורגועה:
      throwForce: 2,    // עוצמת דחיפה אפסית כמעט
      gravity: 1,       // נפילה איטית
      //mass: 3,            // מקשה על הקובייה להסתובב ולהתעופף במהירות
      //friction: 0.8,      // גורם לה להאט מיד במגע
      //settleTimeout: 8000,
    });

    diceBox
      .init()
      .then(() => {
        diceBoxRef.current = diceBox;
        setIsReady(true);

        diceBox.onRollComplete = (results: any) => {
          setIsRolling(false); // 🛑 הגלגול הסתיים - כעת ניתן לנקות או להטיל קובייה חדשה
          const total = results.reduce(
            (sum: number, die: any) => sum + die.value,
            0,
          );
          setLastResult(total);
          if (onRollEnd) {
            onRollEnd(total);
          }
        };
      })
      .catch((err: any) => {
        console.error("Failed to initialize DiceBox:", err);
      });

    return () => {
      if (diceBoxRef.current) {
        diceBoxRef.current.clear();
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || !diceBoxRef.current) return;

    // 🛑 אם הקובייה באמצע גלגול, נתעלם מכל פקודה חדשה (גלגול נוסף או ניקוי)
    if (isRolling) return;

    // 🧹 ניקוי יתבצע רק אם איננו באמצע גלגול
    if (triggerRoll === "CLEAR") {
      diceBoxRef.current.clear();
      setLastResult(null);
    } else if (triggerRoll) {
      setIsRolling(true); // 🎲 מתחיל גלגול - חוסם ניקוי וגלגולים נוספים עד לסיום
      setLastResult(null);
      diceBoxRef.current.clear();

      // 🎯 זריקה עם סחרור מופחת (spinForce)
      diceBoxRef.current.roll(triggerRoll, {
        // target: { x: 0, y: 0 },
        // spinForce: 4, // 👈 מוריד את מהירות הטרלול/סיבוב ההתחלתי (ברירת מחדל: ~4-6)
      });
    }
  }, [triggerRoll, isReady, isRolling]);

  return (
    <>
      {/* עטיפה חיצונית שממרכזת במסך */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        
        {/* 🎯 ה-Container של הקובייה - כאן אתה קובע את הגודל הרצוי! */}
        {/* למשל: w-[500px] h-[500px] או w-[80vw] h-[60vh] */}
        <div
          id="dice-box"
          className="w-[500px] h-[500px] relative overflow-hidden"
        />

      </div>

      {lastResult !== null && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-slate-900/90 border border-amber-500/60 rounded-2xl text-amber-300 font-extrabold text-2xl shadow-2xl backdrop-blur-md animate-bounce">
          🎲 תוצאה: {lastResult}
        </div>
      )}
    </>
  );
};