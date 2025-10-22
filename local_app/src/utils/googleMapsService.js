const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

class GoogleMapsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.isApiLoadedState = false; 
    this.areServicesInitialized = false;
    this.autocompleteService = null;
    this.geocoderService = null;
    this.directionsService = null;
    this.initializePromise = null;

    if (typeof window !== 'undefined') {
      this.checkAndInitialize();
    }
  }

  checkAndInitialize() {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      this.isApiLoadedState = true;
      if (!this.areServicesInitialized) {
        this.initializeServices();
      }
    } else {
      this.isApiLoadedState = false;
      this.areServicesInitialized = false;
    }
  }
  
  get isLoaded() {
    this.checkAndInitialize(); 
    return this.isApiLoadedState && this.areServicesInitialized;
  }

  initializeServices() {
    if (this.areServicesInitialized) return Promise.resolve();
    if (this.initializePromise) return this.initializePromise;

    this.initializePromise = new Promise((resolve, reject) => {
      const attemptInitialization = () => {
        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
          try {
            this.autocompleteService = new window.google.maps.places.AutocompleteService();
            this.geocoderService = new window.google.maps.Geocoder();
            this.directionsService = new window.google.maps.DirectionsService();
            
            this.isApiLoadedState = true;
            this.areServicesInitialized = true;
            console.log("Google Maps services initialized successfully via initializeServices.");
            resolve();
          } catch (error) {
            console.error("Error during Google Maps service instantiation:", error);
            this.areServicesInitialized = false;
            reject(error);
          }
        } else {
          console.warn("Google Maps API or required libraries (places, Geocoder) not fully loaded yet during initializeServices. Will retry or wait for ensureServicesInitialized.");
          reject(new Error("Google Maps API not fully loaded."));
        }
      };
      attemptInitialization();
    }).finally(() => {
      this.initializePromise = null; 
    });
    return this.initializePromise;
  }

  async ensureServicesInitialized() {
    if (this.isLoaded) return; 
    
    if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places || !window.google.maps.Geocoder) {
      console.warn("ensureServicesInitialized called, but Google Maps API not ready. Waiting for LoadScript's onLoad.");
      
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20; 
        const interval = setInterval(() => {
          attempts++;
          if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
            clearInterval(interval);
            this.initializeServices().then(resolve).catch(reject);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error("Google Maps API did not load after multiple attempts in ensureServicesInitialized.");
            reject(new Error("Google Maps API failed to load."));
          }
        }, 250);
      });
    }
    return this.initializeServices();
  }


  async getPlacePredictions(input, types = ['address'], componentRestrictions = { country: 'ar' }) {
    await this.ensureServicesInitialized();
    if (!this.autocompleteService) {
      console.error("Google AutocompleteService not available.");
      throw new Error("AutocompleteService no disponible.");
    }
    if (!input || input.trim() === "") return [];

    return new Promise((resolve, reject) => {
      this.autocompleteService.getPlacePredictions(
        { input, types, componentRestrictions },
        (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            console.warn("Google AutocompleteService error:", status, "for input:", input);
            if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve([]);
            } else {
              reject(new Error(`Error de Autocompletado: ${status}`));
            }
            return;
          }
          resolve(
            predictions.map(p => ({
              id: p.place_id,
              description: p.description,
            }))
          );
        }
      );
    });
  }

  async getGeocode(params) { 
    await this.ensureServicesInitialized();
    if (!this.geocoderService) {
      console.error("Google GeocoderService not available.");
      throw new Error("GeocoderService no disponible.");
    }
    return new Promise((resolve, reject) => {
      this.geocoderService.geocode(params, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const firstResult = results[0];
          resolve({
            address: firstResult.formatted_address,
            lat: firstResult.geometry.location.lat(),
            lng: firstResult.geometry.location.lng(),
            placeId: firstResult.place_id,
            city: firstResult.address_components.find(c => c.types.includes('locality'))?.long_name,
            country: firstResult.address_components.find(c => c.types.includes('country'))?.long_name,
          });
        } else {
          console.warn("Google GeocoderService error:", status, "for params:", params);
          reject(new Error(`Geocodificación fallida: ${status}`));
        }
      });
    });
  }

  async getPlaceDetails(placeId, fields = ['place_id', 'name', 'formatted_address', 'geometry']) {
    await this.ensureServicesInitialized();
    if (!this.geocoderService) {
      console.error("GeocoderService not available.");
      throw new Error("GeocoderService no disponible.");
    }
  
    return new Promise((resolve, reject) => {
      this.geocoderService.geocode({ placeId: placeId }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          const result = results[0];
          resolve({
            id: result.place_id,
            name: result.formatted_address.split(',')[0], 
            address: result.formatted_address,
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          });
        } else {
          console.error("Geocoder failed for placeId", placeId, "with status", status);
          reject(new Error(`Error al obtener detalles del lugar: ${status}`));
        }
      });
    });
  }

  async getDirections(origin, destination, travelMode = 'DRIVING') {
    await this.ensureServicesInitialized();
    if (!this.directionsService) {
      console.error("Google DirectionsService not available.");
      throw new Error("DirectionsService no disponible.");
    }
    if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number' || 
        !destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      console.error("Invalid origin or destination for getDirections:", origin, destination);
      throw new Error("Origen o destino inválido para calcular la ruta.");
    }
    return new Promise((resolve, reject) => {
      this.directionsService.route(
        {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: window.google.maps.TravelMode[travelMode.toUpperCase()],
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result && result.routes && result.routes[0]) {
            const route = result.routes[0];
            const leg = route.legs[0];
            resolve({
              distance: leg.distance.value / 1000, // km
              duration: Math.round(leg.duration.value / 60), // minutes
              polyline: route.overview_polyline, // encoded polyline string
              steps: leg.steps.map(step => ({
                instructions: step.instructions,
                distance: step.distance.text,
                duration: step.duration.text,
              })),
              bounds: route.bounds,
            });
          } else {
            console.warn("Google DirectionsService error:", status, "for route from", origin, "to", destination);
            reject(new Error(`Error al obtener direcciones: ${status}`));
          }
        }
      );
    });
  }
}

export const googleMapsService = new GoogleMapsService(GOOGLE_MAPS_API_KEY);

if (typeof window !== 'undefined') {
  window.initGoogleMapsApiAndServices = () => {
    googleMapsService.ensureServicesInitialized().catch(err => {
      console.error("Error global inicializando servicios de Google Maps:", err);
    });
  };
}