import { supabase } from '@/lib/supabaseClient';
import { geolocationService } from '@/utils/geolocation';

class RealtimeLocationService {
  constructor() {
    this.intervalId = null;
    this.channel = null;
    this.currentUser = null;
    this.currentRideId = null;
    this.lastBroadcastedLocation = null;
    this.isBroadcasting = false;
  }

  getDistance(coords1, coords2) {
    if (!coords1 || !coords2) return Infinity;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  start(user, rideId, onDriverUpdate, onPassengerUpdate) {
    if (this.isBroadcasting) {
      this.stop();
    }

    this.currentUser = user;
    this.currentRideId = rideId;
    this.lastBroadcastedLocation = null;
    const channelName = `ride-${rideId}`;
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          ack: true,
        },
      },
    });

    this.channel
      .on('broadcast', { event: 'driver_location_update' }, (payload) => onDriverUpdate(payload.payload))
      .on('broadcast', { event: 'passenger_location_update' }, (payload) => onPassengerUpdate(payload.payload))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Suscrito al canal de ubicación en tiempo real: ${channelName}`);
          this.broadcastLocation();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Error de canal de ubicación: ${status}`);
        }
      });
    
    this.isBroadcasting = true;

    this.intervalId = setInterval(() => {
      this.broadcastLocation();
    }, 2000); 
  }

  async broadcastLocation() {
    if (!this.channel || !this.currentUser || !this.currentRideId) return;
    
    try {
      const position = await geolocationService.getCurrentPosition();
      const { latitude, longitude, heading } = position.coords;
      const currentLocationData = { lat: latitude, lng: longitude, heading: heading || 0 };

      const distance = this.getDistance(this.lastBroadcastedLocation, currentLocationData);

      if (distance >= 5) { 
        const eventType = this.currentUser.user_type === 'driver' 
          ? 'driver_location_update' 
          : 'passenger_location_update';

        await this.channel.send({
          type: 'broadcast',
          event: eventType,
          payload: {
            userId: this.currentUser.id,
            location: currentLocationData,
          },
        });

        this.lastBroadcastedLocation = currentLocationData;
      }
    } catch (error) {
      console.error('Error al transmitir la ubicación:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.channel) {
      supabase.removeChannel(this.channel).catch(err => console.error("Error al remover el canal:", err));
      this.channel = null;
    }
    this.currentUser = null;
    this.currentRideId = null;
    this.lastBroadcastedLocation = null;
    this.isBroadcasting = false;
    console.log('Transmisión de ubicación en tiempo real detenida.');
  }
}

export const realtimeLocationService = new RealtimeLocationService();