import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

import LiveRidesHeader from '@/components/admin/live-rides/LiveRidesHeader';
import LiveRidesStats from '@/components/admin/live-rides/LiveRidesStats';
import LiveRidesTable from '@/components/admin/live-rides/LiveRidesTable';
import ActiveDriversMap from '@/components/admin/live-rides/ActiveDriversMap';

const AdminLiveRidesPage = () => {
  const [liveRides, setLiveRides] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filters, setFilters] = useState({ city: '', status: '' });
  const [selectedRideId, setSelectedRideId] = useState(null);
  const { user } = useAuth();
  
  const intervalRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const commonSelect = 'id, created_at, status, origin_address, destination_address, fare_estimated, ride_type, passenger:passenger_id(id, full_name, phone), driver:driver_id(id, full_name, phone, vehicle_info)';
      
      const ridesPromise = supabase.from('rides').select(commonSelect).in('status', ['searching', 'pending', 'driver_assigned', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress']);
      const scheduledPromise = supabase.from('scheduled_rides').select(commonSelect).in('status', ['scheduled', 'driver_assigned', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress']);
      const hourlyPromise = supabase.from('hourly_bookings').select('id, created_at, status, start_location_address, description, total_fare, ride_type, passenger:passenger_id(id, full_name, phone), driver:driver_id(id, full_name, phone, vehicle_info)').in('status', ['pending', 'accepted', 'in_progress']);
      
      const driversPromise = supabase
        .from('profiles')
        .select('id, full_name, phone, status, last_location, vehicle_info, last_location_updated_at')
        .eq('user_type', 'driver')
        .in('status', ['available', 'on_trip'])
        .not('last_location', 'is', null);

      const [ridesResult, scheduledResult, hourlyResult, driversResult] = await Promise.all([ridesPromise, scheduledPromise, hourlyPromise, driversPromise]);

      const normalizedRides = (ridesResult.data || []).map(r => ({...r, ride_type: r.ride_type || 'now'}));
      const normalizedScheduled = (scheduledResult.data || []).map(r => ({...r, ride_type: 'scheduled'}));
      const normalizedHourly = (hourlyResult.data || []).map(r => ({
          ...r,
          ride_type: 'hourly',
          origin_address: r.start_location_address,
          destination_address: r.description,
          fare_estimated: r.total_fare
      }));

      const allLiveRides = [...normalizedRides, ...normalizedScheduled, ...normalizedHourly];
      allLiveRides.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setLiveRides(allLiveRides);

      if (driversResult.data) {
        const now = new Date();
        const activeDriversFiltered = driversResult.data.filter(driver => {
          if (!driver.last_location_updated_at) return false;
          const lastSeen = new Date(driver.last_location_updated_at);
          return (now - lastSeen) / 1000 <= 60; // Active in last 60 seconds
        });
        setActiveDrivers(activeDriversFiltered);
      }

    } catch (error) {
      console.error('Error fetching live data:', error);
      toast({
        title: "Error de Sincronización",
        description: "No se pudieron cargar los datos en vivo.",
        variant: "destructive"
      });
    } finally {
      setLastUpdate(new Date());
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleCancelRide = async (rideId, reason) => {
    try {
      const rideToCancel = liveRides.find(r => r.id === rideId);
      if (!rideToCancel || !user) return;

      const { data, error } = await supabase.rpc('cancel_ride', {
        p_ride_id: rideId,
        p_ride_type: rideToCancel.ride_type,
        p_canceller_id: user.id,
        p_reason: `Admin: ${reason}`
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast({ title: "Viaje Cancelado", description: "El viaje ha sido cancelado exitosamente." });
      fetchData();
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast({ title: "Error", description: `No se pudo cancelar el viaje: ${error.message}`, variant: "destructive" });
    }
  };

  const handleSelectRide = (rideId) => {
    setSelectedRideId(rideId === selectedRideId ? null : rideId);
  };

  const filteredRides = useMemo(() => liveRides.filter(ride => {
    const cityMatch = !filters.city || 
      ride.origin_address?.toLowerCase().includes(filters.city.toLowerCase()) ||
      ride.destination_address?.toLowerCase().includes(filters.city.toLowerCase());
    const statusMatch = !filters.status || ride.status === filters.status;
    return cityMatch && statusMatch;
  }), [liveRides, filters]);

  const selectedRide = useMemo(() => {
    return selectedRideId ? liveRides.find(ride => ride.id === selectedRideId) : null;
  }, [selectedRideId, liveRides]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <LiveRidesHeader 
        lastUpdate={lastUpdate} 
        loading={loading}
        filters={filters}
        onFilterChange={setFilters}
        onUpdate={fetchData}
      />

      <LiveRidesStats 
        ridesCount={filteredRides.length}
        driversCount={activeDrivers.length}
        availableDriversCount={activeDrivers.filter(d => d.status === 'available').length}
      />

      <LiveRidesTable 
        rides={filteredRides}
        selectedRideId={selectedRideId}
        onSelectRide={handleSelectRide}
        onCancelRide={handleCancelRide}
      />
      
      <ActiveDriversMap 
        drivers={activeDrivers}
        selectedRide={selectedRide}
      />
    </motion.div>
  );
};

export default AdminLiveRidesPage;