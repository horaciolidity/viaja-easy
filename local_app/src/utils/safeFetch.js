import { toast } from '@/components/ui/use-toast';

export const safeFetch = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const text = await response.text();

    if (!response.ok) {
      let errorData = { message: `Error del servidor: ${response.status} ${response.statusText}` };
      if (text) {
        try {
          const parsedError = JSON.parse(text);
          errorData = { ...errorData, ...parsedError };
        } catch (e) {
          // Ignore if the error response is not JSON
        }
      }
      throw errorData;
    }

    if (text) {
      return JSON.parse(text);
    }

    return null;
  } catch (error) {
    console.error(`Error en la solicitud a ${url}:`, error);
    toast({
      title: "Error de Comunicación",
      description: error.message || "No se pudo completar la solicitud.",
      variant: "destructive",
    });
    throw error;
  }
};