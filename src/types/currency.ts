export type Currency = 'USD' | 'KES';

export type CurrencyState = {
  currency: Currency;
  usdToKesRate: number;
  lastUpdated: Date | null;
  isLoading: boolean;
};

export interface CurrencyContextType {
  currency: Currency;
  usdToKesRate: number;
  setCurrency: (currency: Currency) => void;
  refreshRate: () => Promise<void>;
  formatPrice: (usdAmount: number) => string;
  prices: { usd: number; kes: number };
}

