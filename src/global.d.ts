export {};

declare global {
  interface Window {
    TradingView: any; // Ты можешь уточнить тип, если есть доки, но к ним нет доступа
  }
}