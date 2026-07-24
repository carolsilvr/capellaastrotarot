import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!publishableKey) {
      console.warn('VITE_STRIPE_PUBLIC_KEY não está definida nas variáveis de ambiente.');
    }
    stripePromise = loadStripe(publishableKey || '');
  }
  return stripePromise;
};
