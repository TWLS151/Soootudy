import { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Sparkles } from 'lucide-react';
import type { CharacterDef } from '../lib/characters';

interface CharacterUnlockModalProps {
  characters: CharacterDef[];
  onClose: () => void;
}

export default function CharacterUnlockModal({ characters, onClose }: CharacterUnlockModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = characters[currentIndex];
  const isLast = currentIndex >= characters.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full text-center animate-[scaleIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            새 캐릭터 해금!
          </h2>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>

        {/* Character Animation */}
        <div className="w-32 h-32 mx-auto mb-4">
          <DotLottieReact src={current.lottie} loop autoplay />
        </div>

        {/* Character Name */}
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {current.name}
        </p>

        {/* Unlock Condition */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {current.description} 달성!
        </p>

        {/* Action Button */}
        {isLast ? (
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            확인
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            다음 캐릭터 ({currentIndex + 1}/{characters.length})
          </button>
        )}
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
