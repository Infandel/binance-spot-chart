export interface BinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  isSpotTradingAllowed: boolean;
}

export interface BinanceExchangeInfo {
  symbols: BinanceSymbol[];
}

export interface TradingViewSymbol {
  symbol: string;
  description: string;
  exchange: string;
  type: string;
}