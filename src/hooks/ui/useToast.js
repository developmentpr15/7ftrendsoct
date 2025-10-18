import { useState, useCallback, useRef, useEffect } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastIdRef.current;
    const newToast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now(),
    };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Auto-remove old toasts
  useEffect(() => {
    const interval = setInterval(() => {
      setToasts(prev => {
        const now = Date.now();
        return prev.filter(toast => now - toast.timestamp < 10000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  };
};

export default useToast;