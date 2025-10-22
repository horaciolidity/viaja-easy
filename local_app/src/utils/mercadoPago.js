export function formatCurrencyARS(amount) {
  if (typeof amount !== 'number') {
    amount = 0;
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
}

export const loadMercadoPagoScript = () => {
    return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('mercadopago-sdk');
        if (existingScript) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.id = 'mercadopago-sdk';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
};