import { toast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';

class ErrorHandler {
  constructor() {
    this.isOnline = true;
    this.errorMessages = {
      default: 'Ocurrió un error inesperado.',
      network: 'Error de red. Por favor, comprueba tu conexión a internet.',
      auth: 'Error de autenticación. Por favor, inicia sesión de nuevo.',
      server: 'El servidor encontró un problema. Inténtalo de nuevo más tarde.',
      permission: 'No tienes permiso para realizar esta acción.',
      notFound: 'El recurso solicitado no fue encontrado.',
      conflict: 'Conflicto de datos. La información podría haber sido modificada por otro usuario.',
    };
  }

  setNetworkStatus(isOnline) {
    this.isOnline = isOnline;
  }

  isNetworkError(error) {
    const message = error.message.toLowerCase();
    return message.includes('failed to fetch') || message.includes('network request failed');
  }

  isAuthError(error) {
    const message = error.message.toLowerCase();
    return message.includes('invalid session') || message.includes('jwt expired');
  }

  isSupabaseError(error) {
    return error && typeof error.code === 'string' && error.code.startsWith('PGRST');
  }

  getSupabaseErrorMessage(error) {
    if (error.details && typeof error.details === 'string') {
        if (error.details.includes('RIDE_UNAVAILABLE')) return 'El viaje ya no está disponible.';
    }
    switch (error.code) {
      case 'PGRST116': return 'El recurso que buscas no existe.';
      case 'PGRST301': // Foreign key violation or similar
        if (error.details && error.details.includes('violates foreign key constraint')) {
            return 'No se pudo completar la acción debido a datos relacionados faltantes.';
        }
        return 'Error de base de datos. Por favor, intenta de nuevo.';
      case '23505': // Unique violation
        return 'Ya existe un registro con estos datos.';
      default:
        return error.message || this.errorMessages.server;
    }
  }

  handleError(error, context = 'realizando una operación') {
    let title = 'Error';
    let description = this.errorMessages.default;
    let variant = 'destructive';

    if (!this.isOnline || this.isNetworkError(error)) {
      title = 'Error de Conexión';
      description = `No se pudo ${context}. ${this.errorMessages.network}`;
    } else if (this.isAuthError(error)) {
      title = 'Error de Sesión';
      description = this.errorMessages.auth;
    } else if (this.isSupabaseError(error)) {
      title = 'Error del Servidor';
      description = this.getSupabaseErrorMessage(error);
    } else if (error.message) {
      if (error.message.includes('permission denied')) {
        title = 'Acceso Denegado';
        description = this.errorMessages.permission;
      } else {
        description = error.message;
      }
    }

    console.error(`Error en (${context}):`, error);

    toast({
      title: title,
      description: description,
      variant: variant,
      duration: 5000,
    });
  }
  
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1 || !this.isNetworkError(error)) {
                throw error;
            }
            console.warn(`Intento ${i + 1} fallido. Reintentando en ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay * (i + 1))); // Incremental backoff
        }
    }
  }
}

export const NetworkErrorHandler = new ErrorHandler();

export const NetworkStatusUpdater = () => {
    const { isOnline } = useNetworkStatus();
    NetworkErrorHandler.setNetworkStatus(isOnline);
    return null;
};