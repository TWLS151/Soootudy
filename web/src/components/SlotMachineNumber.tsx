import { useEffect, useState, useMemo } from 'react';
import { Flame } from 'lucide-react';

interface SlotMachineNumberProps {
  from: number;
  to: number;
  duration?: number;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const DIGIT_HEIGHT = 48; // px per digit cell

function SlotDigit({ from, to, delay }: { from: number; to: number; delay: number }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Start position: show `from` digit
  // End position: show `to` digit (scroll through full cycle + land on target)
  const startY = -from * DIGIT_HEIGHT;
  // Scroll through at least one full cycle (10 digits) + land on `to`
  const extraCycles = 2;
  const endY = -(extraCycles * 10 + to) * DIGIT_HEIGHT;

  // Build repeated digit strip: enough cycles to scroll through
  const strip = useMemo(() => {
    const result: number[] = [];
    for (let c = 0; c < extraCycles + 1; c++) {
      result.push(...DIGITS);
    }
    // Add one more set to ensure we can land properly
    result.push(...DIGITS);
    return result;
  }, []);

  return (
    <div
      className="overflow-hidden"
      style={{ height: DIGIT_HEIGHT, width: 32 }}
    >
      <div
        style={{
          transform: `translateY(${animate ? endY : startY}px)`,
          transition: animate
            ? `transform 1.5s cubic-bezier(0.15, 0.85, 0.35, 1) ${delay}ms`
            : 'none',
        }}
      >
        {strip.map((digit, i) => (
          <div
            key={i}
            className="flex items-center justify-center font-bold text-3xl text-orange-500 dark:text-orange-400"
            style={{ height: DIGIT_HEIGHT }}
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SlotMachineNumber({ from, to, duration = 1500 }: SlotMachineNumberProps) {
  // Split numbers into digit arrays (padded to same length)
  const toStr = String(to);
  const fromStr = String(from).padStart(toStr.length, '0');
  const digits = toStr.split('').map((d, i) => ({
    from: parseInt(fromStr[i] || '0'),
    to: parseInt(d),
  }));

  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowLabel(true), duration + 200);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div className="flex items-center justify-center gap-2">
      <Flame
        className="w-7 h-7 text-orange-500 dark:text-orange-400"
        style={{
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div className="flex">
        {digits.map((d, i) => (
          <SlotDigit
            key={i}
            from={d.from}
            to={d.to}
            delay={i * 150} // Stagger: leftmost digit starts first
          />
        ))}
      </div>
      <span
        className="text-lg font-bold text-slate-700 dark:text-slate-300 transition-opacity duration-500"
        style={{ opacity: showLabel ? 1 : 0 }}
      >
        일 연속
      </span>
      <Flame
        className="w-7 h-7 text-orange-500 dark:text-orange-400"
        style={{
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}
