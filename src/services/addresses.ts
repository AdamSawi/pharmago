/**
 * Client multi-address CRUD — stored as `users/{uid}.addresses: ClientAddress[]`.
 * The array is small (a handful of entries per user) so writes replace it wholesale.
 */
import { doc, onSnapshot, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ClientAddress } from '@/services/auth';

export function listenUserAddresses(
  uid: string,
  onData: (addresses: ClientAddress[]) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    try {
      const data = snap.data();
      onData((data?.addresses as ClientAddress[] | undefined) ?? []);
    } catch (err) {
      console.error('listenUserAddresses processing error:', err);
    }
  }, (err) => console.error('listenUserAddresses listener error:', err));
}

interface ClientAddressInput {
  label: string;
  street: string;
  zipCode: string;
  city: string;
  recipientFirstName?: string;
  recipientLastName?: string;
}

export async function addClientAddress(
  uid: string,
  current: ClientAddress[],
  data: ClientAddressInput,
): Promise<void> {
  const newAddress: ClientAddress = {
    id: Date.now().toString(),
    label: data.label,
    street: data.street,
    zipCode: data.zipCode,
    city: data.city,
    recipientFirstName: data.recipientFirstName,
    recipientLastName: data.recipientLastName,
    isDefault: current.length === 0,
  };
  await updateDoc(doc(db, 'users', uid), { addresses: [...current, newAddress] });
}

export async function updateClientAddress(
  uid: string,
  current: ClientAddress[],
  addressId: string,
  data: ClientAddressInput,
): Promise<void> {
  const next = current.map((a) => (a.id === addressId ? { ...a, ...data } : a));
  await updateDoc(doc(db, 'users', uid), { addresses: next });
}

export async function setDefaultAddress(
  uid: string,
  current: ClientAddress[],
  id: string,
): Promise<void> {
  const next = current.map((a) => ({ ...a, isDefault: a.id === id }));
  await updateDoc(doc(db, 'users', uid), { addresses: next });
}

export async function deleteClientAddress(
  uid: string,
  current: ClientAddress[],
  id: string,
): Promise<void> {
  const removedWasDefault = current.find((a) => a.id === id)?.isDefault ?? false;
  let next = current.filter((a) => a.id !== id);
  if (removedWasDefault && next.length > 0 && !next.some((a) => a.isDefault)) {
    next = next.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
  }
  await updateDoc(doc(db, 'users', uid), { addresses: next });
}
