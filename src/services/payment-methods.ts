/**
 * Client saved cards — stored as `users/{uid}.paymentMethods: PaymentMethod[]`.
 * The array is small so writes replace it wholesale, same pattern as addresses.ts.
 */
import { doc, onSnapshot, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'other';

export interface PaymentMethod {
  id: string;
  type: CardBrand;
  last4: string;
  expiry: string;
  cardHolder: string;
  isDefault: boolean;
}

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]\d|7[01])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'other';
}

export function listenPaymentMethods(
  uid: string,
  onData: (methods: PaymentMethod[]) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    try {
      const data = snap.data();
      onData((data?.paymentMethods as PaymentMethod[] | undefined) ?? []);
    } catch (err) {
      console.error('listenPaymentMethods processing error:', err);
    }
  }, (err) => console.error('listenPaymentMethods listener error:', err));
}

export async function addPaymentMethod(
  uid: string,
  current: PaymentMethod[],
  data: { cardNumber: string; expiry: string; cardHolder: string },
): Promise<void> {
  const newMethod: PaymentMethod = {
    id: Date.now().toString(),
    type: detectCardBrand(data.cardNumber),
    last4: data.cardNumber.replace(/\D/g, '').slice(-4),
    expiry: data.expiry,
    cardHolder: data.cardHolder,
    isDefault: current.length === 0,
  };
  await updateDoc(doc(db, 'users', uid), { paymentMethods: [...current, newMethod] });
}

export async function setDefaultPaymentMethod(
  uid: string,
  current: PaymentMethod[],
  id: string,
): Promise<void> {
  const next = current.map((m) => ({ ...m, isDefault: m.id === id }));
  await updateDoc(doc(db, 'users', uid), { paymentMethods: next });
}

export async function deletePaymentMethod(
  uid: string,
  current: PaymentMethod[],
  id: string,
): Promise<void> {
  const removedWasDefault = current.find((m) => m.id === id)?.isDefault ?? false;
  let next = current.filter((m) => m.id !== id);
  if (removedWasDefault && next.length > 0 && !next.some((m) => m.isDefault)) {
    next = next.map((m, i) => (i === 0 ? { ...m, isDefault: true } : m));
  }
  await updateDoc(doc(db, 'users', uid), { paymentMethods: next });
}
