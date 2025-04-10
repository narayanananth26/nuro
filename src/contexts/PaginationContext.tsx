import React, { createContext, useContext, useState } from 'react';

interface PaginationContextType {
  resetMonitorsPagination: () => void;
  monitorsPaginationResetTrigger: number;
}

const PaginationContext = createContext<PaginationContextType>({
  resetMonitorsPagination: () => {},
  monitorsPaginationResetTrigger: 0
});

export const usePaginationContext = () => useContext(PaginationContext);

export const PaginationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [monitorsPaginationResetTrigger, setMonitorsPaginationResetTrigger] = useState(0);

  const resetMonitorsPagination = () => {
    setMonitorsPaginationResetTrigger(prev => prev + 1);
  };

  return (
    <PaginationContext.Provider value={{ resetMonitorsPagination, monitorsPaginationResetTrigger }}>
      {children}
    </PaginationContext.Provider>
  );
};
