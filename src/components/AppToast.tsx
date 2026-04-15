import React, { useEffect } from 'react';
import '../styles/toast.css';

export type AppToastState = {
  text: string;
  tone: 'success' | 'error' | 'info';
};

type AppToastProps = {
  toast: AppToastState | null;
  onClose: () => void;
  durationMs?: number;
};

const AppToast: React.FC<AppToastProps> = ({ toast, onClose, durationMs = 2800 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [toast, onClose, durationMs]);

  if (!toast) return null;

  return (
    <div className={`app-toast app-toast--${toast.tone}`} role="status" aria-live="polite">
      {toast.text}
    </div>
  );
};

export default AppToast;
