import React from 'react';

/**
 * CurrencyContext provides currency symbol and code to all components
 */
const CurrencyContext = React.createContext({
  symbol: '$',
  code: 'USD',
});

export const useCurrency = () => {
  const context = React.useContext(CurrencyContext);
  if (!context) {
    console.warn('[Currency] useCurrency called outside of CurrencyProvider, using defaults');
    return { symbol: '$', code: 'USD' };
  }
  return context;
};

export const CurrencyProvider = ({ children, symbol = '$', code = 'USD' }) => {
  return (
    <CurrencyContext.Provider value={{ symbol, code }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
