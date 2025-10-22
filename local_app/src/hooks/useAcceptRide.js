import { useState } from 'react';
import { useRide } from '@/contexts/RideContext';

export const useAcceptRide = () => {
  const { acceptRide: acceptRideFromContext, loading } = useRide();
  
  return { acceptRide: acceptRideFromContext, isLoading: loading };
};