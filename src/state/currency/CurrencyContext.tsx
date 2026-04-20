import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Currency, CurrencyContextType } from '../../types/currency';


const API_BASE = 'https://api.exchangerate.host';

interface Props {
  children: ReactNode;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: Props) {
  const [currency, setCurrency_] = useState<Currency>('USD');
  const [usdToKesRate, setUsdToKesRate] = useState(129.5); // default
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('currency');
    if (saved) {
      setCurrency_(saved as Currency);
    }
  }, []);

  const fetchRate = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/latest?base=USD&symbols=KES`);
      const data = await res.json();
      if (data.success) {
        const rate = data.rates.KES;
        setUsdToKesRate(rate);
        setLastUpdated(new Date());
        localStorage.setItem('rate', rate.toString());
        localStorage.setItem('rateUpdated', new Date().toISOString());
      }
    } catch (error) {
      console.error('Rate fetch failed:', error);
      // fallback to saved
      const savedRate = localStorage.getItem('rate');
      if (savedRate) setUsdToKesRate(parseFloat(savedRate));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load saved rate
  useEffect(() => {
    const savedRate = localStorage.getItem('rate');
    const savedTime = localStorage.getItem('rateUpdated');
    if (savedRate) {
      setUsdToKesRate(parseFloat(savedRate));
    }
    if (savedTime) {
      const time = new Date(savedTime);
      const hours = (Date.now() - time.getTime()) / (1000 * 60 * 60);
      if (hours > 6) fetchRate(); // refresh if older than 6h
      else setLastUpdated(time);
    } else {
      fetchRate();
    }
  }, [fetchRate]);

  // Save currency preference
  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrency_(newCurrency);
    localStorage.setItem('currency', newCurrency);
  }, []);

  const formatPrice = useCallback((usdAmount: number) => {
    const amount = currency === 'USD' ? usdAmount : Math.round(usdAmount * usdToKesRate);
    const symbol = currency === 'USD' ? '$' : 'KSh';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [currency, usdToKesRate]);

  const value: CurrencyContextType = {
    currency,
    usdToKesRate,
    setCurrency,
    refreshRate: fetchRate,
    formatPrice,
    prices: {
      usd: usdAmount => usdAmount,
      kes: usdAmount => usdAmount * usdToKesRate,
    },
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

