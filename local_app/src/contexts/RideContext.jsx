import React, { createContext, useContext } from 'react';
import { useRideState } from '@/contexts/RideContext/rideState';

const RideContext = createContext(null);

export const useRide = () => {
  const ctx = useContext(RideContext);
  if (!ctx) {
    throw new Error('useRide debe usarse dentro de un RideProvider');
  }
  return ctx;
};

export const RideProvider = ({ children }) => {
  const rideState = useRideState();
  return (
    <RideContext.Provider value={rideState}>
      {children}
    </RideContext.Provider>
  );
};
