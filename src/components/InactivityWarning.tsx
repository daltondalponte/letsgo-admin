"use client";
import React, { useState, useEffect } from 'react';

interface InactivityWarningProps {
  isVisible: boolean;
  onContinue: () => void;
  onLogout: () => void;
  timeLeft: number;
}

export function InactivityWarning({ isVisible, onContinue, onLogout, timeLeft }: InactivityWarningProps) {
  const [countdown, setCountdown] = useState(timeLeft);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onLogout]);

  useEffect(() => {
    setCountdown(timeLeft);
  }, [timeLeft]);

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          <div className="text-2xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sessão Expirada
          </h3>
          <p className="text-gray-600 mb-4">
            Você ficou inativo por muito tempo. Deseja continuar logado?
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">
              <strong>Logout automático em:</strong> {formatTime(countdown)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onContinue}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Continuar Logado
            </button>
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 