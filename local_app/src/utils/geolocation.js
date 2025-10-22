const geolocationService = {
  watchId: null,
  retryCount: 0,
  maxRetries: 3,
  retryTimeout: null,

  getCurrentPosition: function(options = {}) {
    const { enableHighAccuracy = true, timeout = 15000, maximumAge = 0 } = options;
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La geolocalización no es compatible con este navegador."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.retryCount = 0; // Reset on success
          resolve(position);
        },
        (error) => {
          let message = "Error de geolocalización desconocido.";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = "Permiso de geolocalización denegado.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "La información de ubicación no está disponible.";
              break;
            case error.TIMEOUT:
              message = "La solicitud para obtener la ubicación del usuario ha caducado.";
              break;
          }
          console.error('GEOLOCATION_DEBUG: getCurrentPosition error:', error);
          reject(new Error(message));
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  },

  startWatching: function(callback) {
    if (this.watchId !== null) {
      console.warn("GEOLOCATION_DEBUG: Ya se está rastreando la ubicación. Deteniendo el rastreo anterior.");
      this.stopWatching();
    }
    if (!navigator.geolocation) {
      callback(null, new Error("La geolocalización no es compatible."));
      return;
    }
    
    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 0,
    };

    const onError = (error) => {
      console.error('GEOLOCATION_DEBUG: watchPosition error:', error);
      callback(null, error);

      // Simple retry mechanism for timeouts
      if (error.code === error.TIMEOUT && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`GEOLOCATION_DEBUG: Timeout. Reintentando... (${this.retryCount}/${this.maxRetries})`);
        this.stopWatching(); // Clear previous watch
        this.retryTimeout = setTimeout(() => this.startWatching(callback), 2000 * this.retryCount); // Exponential backoff
      }
    };

    const onSuccess = (position) => {
      this.retryCount = 0; // Reset on success
      clearTimeout(this.retryTimeout);
      callback(position, null);
    };

    this.watchId = navigator.geolocation.watchPosition(onSuccess, onError, watchOptions);
    console.log('GEOLOCATION_DEBUG: watchPosition started with ID:', this.watchId);
  },

  stopWatching: function() {
    if (this.watchId !== null) {
      console.log('GEOLOCATION_DEBUG: Stopping watchPosition with ID:', this.watchId);
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.retryCount = 0;
  }
};

const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return 'N/A';
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes < 1) return '< 1 min';
    if (totalMinutes < 60) return `${totalMinutes} min`;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) return `${hours}h`;
    
    return `${hours}h ${minutes}m`;
};

const formatDistance = (km) => {
    if (km === null || km === undefined || isNaN(km)) return 'N/A';
    return `${parseFloat(km).toFixed(1)} km`;
};

const getBounds = (locations) => {
  if (!locations || locations.length === 0) {
    return null;
  }

  const validLocations = locations.filter(loc => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng));

  if (validLocations.length === 0) {
    return null;
  }

  const initialBounds = {
    minLat: validLocations[0].lat,
    maxLat: validLocations[0].lat,
    minLng: validLocations[0].lng,
    maxLng: validLocations[0].lng,
  };

  const bounds = validLocations.reduce((acc, loc) => {
    return {
      minLat: Math.min(acc.minLat, loc.lat),
      maxLat: Math.max(acc.maxLat, loc.lat),
      minLng: Math.min(acc.minLng, loc.lng),
      maxLng: Math.max(acc.maxLng, loc.lng),
    };
  }, initialBounds);

  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat]
  ];
};

const toRadians = (degrees) => {
  return degrees * Math.PI / 180;
};

const toDegrees = (radians) => {
  return radians * 180 / Math.PI;
};

const calculateBearing = (startPoint, endPoint) => {
  if (!startPoint || !endPoint || typeof startPoint.lat !== 'number' || typeof startPoint.lng !== 'number' || typeof endPoint.lat !== 'number' || typeof endPoint.lng !== 'number') {
    return 0;
  }
  const startLat = toRadians(startPoint.lat);
  const startLng = toRadians(startPoint.lng);
  const endLat = toRadians(endPoint.lat);
  const endLng = toRadians(endPoint.lng);

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
          Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  let brng = Math.atan2(y, x);
  brng = toDegrees(brng);
  return (brng + 360) % 360;
};


export { geolocationService, formatDuration, formatDistance, getBounds, toRadians, toDegrees, calculateBearing };