import React, { createContext, useContext } from 'react';
import { useRideState } from '@/contexts/RideContext/rideState.js';

const RideContext = createContext(null);

export const RideProvider = ({ children }) => {
  const rideState = useRideState();
  return <RideContext.Provider value={rideState}>{children}</RideContext.Provider>;
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};