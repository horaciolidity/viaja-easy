
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = Number(value) || 0;
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateString, options) => {
  if (!dateString) return 'N/A';
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return new Intl.DateTimeFormat('es-AR', options || defaultOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Fecha inválida';
  }
};
