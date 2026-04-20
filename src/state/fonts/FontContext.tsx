import React, { createContext, useContext, useState } from 'react';

export type FontSizeOption = 'Small' | 'Normal' | 'Large' | 'Extra Large';

interface FontContextType {
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    return (localStorage.getItem('appFontSize') as FontSizeOption) || 'Normal';
  });

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    localStorage.setItem('appFontSize', size);
  };

  return (
    <FontContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) throw new Error('useFont must be used within FontProvider');
  return context;
};
