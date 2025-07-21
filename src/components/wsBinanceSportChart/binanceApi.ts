import { BinanceExchangeInfo, TradingViewSymbol } from './types';

export const fetchBinanceSpotSymbols = async (): Promise<TradingViewSymbol[]> => {
  try {
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo ');
    const data = (await response.json()) as BinanceExchangeInfo;

    return data.symbols
      .filter((s) => s.status === 'TRADING' && s.isSpotTradingAllowed)
      .map((s) => ({
        symbol: `BINANCE:${s.symbol}`,
        description: `${s.baseAsset}/${s.quoteAsset}`,
        exchange: 'BINANCE',
        type: 'crypto',
      }));
  } catch (error) {
    console.error('Ошибка загрузки данных с Binance:', error);
    return [];
  }
};