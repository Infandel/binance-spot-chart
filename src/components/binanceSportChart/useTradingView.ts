import { useEffect, useState } from 'react';

export const useTradingView = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.TradingView) {
      setIsReady(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.TradingView) {
        clearInterval(interval);
        setIsReady(true);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setError('TradingView не загрузился вовремя');
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return { isReady, error };
};