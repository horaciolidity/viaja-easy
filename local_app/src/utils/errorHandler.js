import { toast } from '@/components/ui/use-toast';

export class NetworkErrorHandler {
  static isNetworkError(error) {
    if (!error) return false;
    const errorMessage = (error.message || '').toLowerCase();
    const isOffline = !navigator.onLine;
    return isOffline || errorMessage.includes('failed to fetch') || errorMessage.includes('network request failed');
  }

  static isAuthError(error) {
    if (!error) return false;
    const errorMessage = (error.message || '').toLowerCase();
    const errorCode = error.code || error.status;
    
    return (
      errorMessage.includes('session not found') ||
      errorMessage.includes('auth session not found') ||
      errorMessage.includes('invalid jwt') ||
      errorMessage.includes('jwt expired') ||
      errorCode === 401 || errorCode === 403
    );
  }
  
  static isIgnoredAuthError(error) {
    if (!error) return false;
    const errorMessage = (error.message || '').toLowerCase();
    const errorCode = error.code || error.error_code;
    return errorCode === 'session_not_found' || errorMessage.includes('session from session_id claim in jwt does not exist');
  }

  static async handleSessionError(error, authContext) {
    if (this.isAuthError(error)) {
      if (authContext && typeof authContext.logout === 'function') {
        await authContext.logout({
          showToast: true,
          message: "Tu sesión ha expirado",
          description: "Por favor, inicia sesión de nuevo para continuar.",
        });
      }
      return true;
    }
    return false;
  }

  static handleError(error, context = 'una operación') {
    const isNetwork = this.isNetworkError(error);
    const isAuth = this.isAuthError(error);
    const isIgnoredAuthError = this.isIgnoredAuthError(error);

    if (isIgnoredAuthError) {
      console.warn(`Ignored auth error in context: ${context}.`, error.message);
      return;
    }

    if (isNetwork) {
      toast({
        title: "Error de conexión",
        description: `No se pudo completar ${context}. Revisa tu conexión a internet.`,
        variant: "destructive",
      });
      console.error(`Network error during ${context}:`, error);
    } else if (isAuth) {
      toast({
        title: "Error de Sesión",
        description: "Tu sesión ha expirado o no es válida. Serás redirigido.",
        variant: "destructive",
      });
      console.error(`Auth error during ${context}:`, error);
    } else {
      toast({
        title: "Error Inesperado",
        description: `Ocurrió un error durante ${context}.`,
        variant: "destructive",
      });
      console.error(`Error during ${context}:`, error);
    }
  }
  
  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (this.isNetworkError(error) && i < maxRetries - 1) {
          console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
        } else {
          throw error;
        }
      }
    }
  }
}

export const handleAndThrowError = (error, context = 'una operación') => {
  NetworkErrorHandler.handleError(error, context);
  throw error;
};