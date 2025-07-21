import { BinanceSymbol } from "./types";

export type BinanceUpdateMessage = {
  u: number; // Обновление
  s: string; // Символ
  st: string; // Status
  sp: boolean; // isSpotTradingAllowed
};

export type BinanceStreamMessage = {
  data: {
    u: number;
    s: string;
    st: string;
    sp: boolean;
  };
};

export const connectBinanceWebSocket = (
  onUpdate: (updatedSymbol: BinanceSymbol) => void
): (() => void) => {
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/!exchangeInfo'); // TODO: Ничего не выдаёт надо разбираться

  ws.onopen = () => {
    console.log('WebSocket: Подключено к Binance');
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data.toString()) as BinanceStreamMessage;
      const { s: symbol, st: status, sp: isSpotTradingAllowed } = message.data;

      const updatedSymbol: BinanceSymbol = {
        symbol,
        status,
        baseAsset: symbol.split('USDT')[0] || 'UNKNOWN',
        quoteAsset: symbol.endsWith('USDT') ? 'USDT' : 'UNKNOWN',
        isSpotTradingAllowed,
      };

      onUpdate(updatedSymbol);
    } catch (error) {
      console.error('Ошибка обработки WebSocket-сообщения:', error);
    }
  };

  ws.onclose = (e) => {
    console.log(`WebSocket: Соединение закрыто, код: ${e.code}, причина: ${e.reason}`);
    // Повторное подключение через 5 секунд
    setTimeout(() => {
      console.log('WebSocket: Переподключение...');
      connectBinanceWebSocket(onUpdate);
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket: Ошибка подключения', error);
    ws.close();
  };

  return () => {
    ws.close();
    console.log('WebSocket: Соединение закрыто вручную');
  };
};