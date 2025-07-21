import React, { useEffect, useState, useRef } from 'react';

// Типы
interface BinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  isSpotTradingAllowed: boolean;
}

interface BinanceExchangeInfo {
  symbols: BinanceSymbol[];
}

interface TradingViewSymbol {
  symbol: string;
  description: string;
}

// Вытаскиваем все доступные пары с публичного API бинанса
const fetchBinanceSpotSymbols = async (): Promise<TradingViewSymbol[]> => {
  try {
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo ');
    const data = (await response.json()) as BinanceExchangeInfo;

    return data.symbols
      // Фильтруем только связанные с бинансом, торгуемые и торговлей спотами(?)
      .filter((s) => s.status === 'TRADING' && s.isSpotTradingAllowed)
      .map((s) => ({
        symbol: `BINANCE:${s.symbol}`,
        description: `${s.baseAsset}/${s.quoteAsset}`,
        exchange: 'BINANCE',
        type: 'crypto',
      }));
  } catch (error) {
    console.error('Ошибка при загрузке символов с Binance:', error);
    return [];
  }
};

const BinanceSpotChartWidget: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<any>(null);
  const [symbols, setSymbols] = useState<TradingViewSymbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка символов
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const spotSymbols = await fetchBinanceSpotSymbols();
        setSymbols(spotSymbols);
      } catch (err) {
        console.error('Ошибка загрузки символов', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSymbols();
  }, []);

  // Создание/обновление графика
  useEffect(() => {
    if (!symbols.length || !chartContainerRef.current || isLoading) return;

    const container = chartContainerRef.current;

    // Функция инициализации виджета
    const initWidget = () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove(); // Полная очистка
      }

      tvWidgetRef.current = new window.TradingView.widget({
        container_id: container.id,
        autosize: true,
        symbol: selectedSymbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'ru',
        enable_publishing: false,
        withdateranges: true,
        allow_symbol_change: false,
        hide_side_toolbar: false,

        // Только Binance-символы // Но этот пропс не работает, офф. документация https://github.com/tradingview/charting_library/ не доступна
        symbols_set: {
          symbols,
        },
      });
    };

    // Если TradingView уже загружен
    if (window.TradingView) {
      initWidget();
    } else {
      // Ждём загрузки скрипта
      const interval = setInterval(() => {
        if (window.TradingView) {
          clearInterval(interval);
          initWidget();
        }
      }, 200);

      return () => clearInterval(interval);
    }

    return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
    };
  }, [symbols, selectedSymbol, isLoading]);

  // Смена символа
  const changeSymbol = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
  };

  if (isLoading) {
    return <div>Загрузка данных...</div>;
  }

  return (
    <div>
      {/* Выбор символа */}
      <div style={{ marginBottom: '10px' }}>
        <label>Пара: </label>
        <select value={selectedSymbol} onChange={(e) => changeSymbol(e.target.value)}>
          {symbols.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.description}
            </option>
          ))}
        </select>
      </div>

      {/* Контейнер графика */}
      <div
        id="tradingview_chart"
        ref={chartContainerRef}
        style={{
          height: '600px',
          width: '100%',
        }}
      />
    </div>
  );
};



export default BinanceSpotChartWidget;