import { supabase } from '@/lib/supabaseClient';
import { geolocationService } from '@/utils/geolocation';

class DriverLocationService {
  constructor() {
    this.isTracking = false;
    this.lastKnownLocation = null;
    this.driverId = null;
    this.watchId = null;
  }

  async startTracking(driverId) {
    if (this.isTracking) {
      console.log('Ya se está rastreando la ubicación del conductor');
      return;
    }

    this.driverId = driverId;
    this.isTracking = true;

    try {
      await this.updateLocationOnce();
      
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handleLocationUpdate(position);
        },
        (error) => {
          console.error('Error de geolocalización en watchPosition:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, 
          distanceFilter: 10
        }
      );

      console.log('Seguimiento de ubicación iniciado para conductor:', driverId);
    } catch (error) {
      console.error('Error al iniciar seguimiento de ubicación:', error);
      this.stopTracking();
    }
  }

  async handleLocationUpdate(position) {
    const { latitude, longitude, heading } = position.coords;
    const newLocation = {
      lat: latitude,
      lng: longitude,
      heading: heading ?? 0,
      timestamp: new Date().toISOString()
    };
    
    if (this.shouldUpdateDatabase(newLocation)) {
      await this.saveLocationToDatabase(newLocation);
      this.lastKnownLocation = newLocation;
    }
  }

  shouldUpdateDatabase(newLocation) {
    if (!this.lastKnownLocation) return true;
    const timeDiff = new Date(newLocation.timestamp) - new Date(this.lastKnownLocation.timestamp);
    if (timeDiff < 3000) return false;
    
    const distance = this.calculateDistance(this.lastKnownLocation, newLocation);
    return distance > 10;
  }

  calculateDistance(loc1, loc2) {
    const R = 6371e3;
    const φ1 = loc1.lat * Math.PI/180;
    const φ2 = loc2.lat * Math.PI/180;
    const Δφ = (loc2.lat-loc1.lat) * Math.PI/180;
    const Δλ = (loc2.lng-loc1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  async updateLocationOnce() {
    if (!this.driverId) return;

    try {
      const position = await geolocationService.getCurrentPosition();
      await this.handleLocationUpdate(position);
    } catch (error) {
      console.error('Error al obtener ubicación actual:', error);
    }
  }

  async saveLocationToDatabase(location) {
    if (!this.driverId) return;

    try {
      const { error } = await supabase.rpc('update_driver_location', {
        p_driver_id: this.driverId,
        p_latitude: location.lat,
        p_longitude: location.lng,
        p_heading: location.heading
      });

      if (error) {
        console.error('Error al guardar ubicación en base de datos:', error);
      }
    } catch (error) {
      console.error('Error de red al guardar ubicación:', error);
    }
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    this.driverId = null;
    this.lastKnownLocation = null;
    
    console.log('Seguimiento de ubicación detenido');
  }

  async updateDriverStatus(status) {
    if (!this.driverId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: status,
          last_seen: new Date().toISOString()
        })
        .eq('id', this.driverId);

      if (error) {
        console.error('Error al actualizar estado del conductor:', error);
      }
    } catch (error) {
      console.error('Error de red al actualizar estado:', error);
    }
  }
}

export const driverLocationService = new DriverLocationService();