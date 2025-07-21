import React, { useEffect, useRef, useState } from 'react';
import { TradingViewSymbol } from './types';
import { fetchBinanceSpotSymbols } from './binanceApi';
import { connectBinanceWebSocket } from './binanceWebSocket';

const WsBinanceSpotChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [symbols, setSymbols] = useState<TradingViewSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка начального списка
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const spotSymbols = await fetchBinanceSpotSymbols();
        setSymbols(spotSymbols);
      } catch (err) {
        setError('Не удалось загрузить пары с Binance');
      } finally {
        setIsLoading(false);
      }
    };

    loadSymbols();
  }, []);

  // Подключение WebSocket
  useEffect(() => {
    if (isLoading) return;

    const unsubscribe = connectBinanceWebSocket((updatedSymbol) => {
      setSymbols((prevSymbols) => {
        const existingIndex = prevSymbols.findIndex((s) => s.symbol === `BINANCE:${updatedSymbol.symbol}`);

        // Если обновление пары
        if (existingIndex !== -1) {
          const updated = [...prevSymbols];
          const { symbol, status, isSpotTradingAllowed } = updatedSymbol;

          // Если пара больше не торгуется или спот недоступен — удаляем
          if (status !== 'TRADING' || !isSpotTradingAllowed) {
            updated.splice(existingIndex, 1);
          } else {
            // Иначе обновляем (например, если статус поменялся)
            updated[existingIndex] = {
              symbol: `BINANCE:${symbol}`,
              description: `${updatedSymbol.baseAsset}/${updatedSymbol.quoteAsset}`,
              exchange: 'BINANCE',
              type: 'crypto',
            };
          }

          return updated;
        }

        // Если новая пара и она спотовая
        if (
          updatedSymbol.status === 'TRADING' &&
          updatedSymbol.isSpotTradingAllowed
        ) {
          return [
            ...prevSymbols,
            {
              symbol: `BINANCE:${updatedSymbol.symbol}`,
              description: `${updatedSymbol.baseAsset}/${updatedSymbol.quoteAsset}`,
              exchange: 'BINANCE',
              type: 'crypto',
            },
          ];
        }

        return prevSymbols;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isLoading]);

  // Инициализация TradingView
  useEffect(() => {
    if (!symbols.length || !chartRef.current) return;

    // Очистка предыдущего графика
    chartRef.current.innerHTML = '';

    new window.TradingView.widget({
      container_id: chartRef.current.id,
      autosize: true,
      symbol: symbols[0]?.symbol || 'BINANCE:BTCUSDT',
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'ru',
      enable_publishing: false,
      withdateranges: true,
      symbol_search_window: true,
      allow_symbol_change: true,

      symbols_set: {
        symbols,
      },
    });
  }, [symbols]);

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (isLoading) {
    return <div>Загрузка спотовых пар с Binance...</div>;
  }

  return (
    <div
      id="tradingview_chart"
      ref={chartRef}
      style={{ height: '600px', width: '100%' }}
    />
  );
};

export default WsBinanceSpotChart;