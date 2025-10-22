import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import { getAvailableRides, getRideById, getRideHistory, searchRides, getPassengerRideHistory, getDriverRideHistory } from './rideQueries';
import { createRide, updateRideStatus, cancelRide, acceptRide } from './rideOperations';

export const useQueryClient = () => useTanstackQueryClient();

export const useAvailableRides = () => {
  return useQuery({
    queryKey: ['availableRides'], 
    queryFn: getAvailableRides
  });
};

export const useRideDetails = (rideId, rideType) => {
  return useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => getRideById(rideId, rideType),
    enabled: !!rideId,
  });
};

export const useRideHistory = (userId, userType) => {
  return useQuery({
    queryKey: ['rideHistory', userId, userType],
    queryFn: () => getRideHistory(userId, userType),
    enabled: !!userId,
  });
};

export const useCreateRide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableRides'] });
      queryClient.invalidateQueries({ queryKey: ['rideHistory'] });
    },
  });
};

export const useUpdateRideStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rideId, rideType, status, extraData }) => updateRideStatus(rideId, rideType, status, extraData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ride', variables.rideId] });
      queryClient.invalidateQueries({ queryKey: ['availableRides'] });
      queryClient.invalidateQueries({ queryKey: ['rideHistory'] });
    },
  });
};

export const useCancelRide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rideId, rideType, reason }) => cancelRide(rideId, rideType, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ride', variables.rideId] });
      queryClient.invalidateQueries({ queryKey: ['availableRides'] });
      queryClient.invalidateQueries({ queryKey: ['rideHistory'] });
    },
  });
};

export const useAcceptRideMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ rideId, rideType }) => acceptRide(rideId, rideType),
        onSuccess: (data, { rideId }) => {
            queryClient.invalidateQueries({ queryKey: ['availableRides'] });
            queryClient.invalidateQueries({ queryKey: ['ride', rideId] });
            queryClient.invalidateQueries({ queryKey: ['rideHistory'] });
        },
    });
};

export const useSearchRides = (searchTerm) => {
  return useQuery({
    queryKey: ['searchRides', searchTerm],
    queryFn: () => searchRides(searchTerm),
    enabled: !!searchTerm,
  });
};

export const usePassengerRideHistory = (passengerId) => {
  return useQuery({
    queryKey: ['passengerRideHistory', passengerId],
    queryFn: () => getPassengerRideHistory(passengerId),
    enabled: !!passengerId,
  });
};

export const useDriverRideHistory = (driverId) => {
  return useQuery({
    queryKey: ['driverRideHistory', driverId],
    queryFn: () => getDriverRideHistory(driverId),
    enabled: !!driverId,
  });
};