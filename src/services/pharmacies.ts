import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Address } from '@/services/auth';

export interface PharmacyDoc {
  id: string;
  name: string;
  address: string;
  addressDetails?: Address;
  isOpen: boolean;
  rating: number;
}

export async function getPharmacies(): Promise<PharmacyDoc[]> {
  const snap = await getDocs(collection(db, 'pharmacies'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PharmacyDoc));
}

export async function getPharmacy(id: string): Promise<PharmacyDoc | null> {
  const snap = await getDoc(doc(db, 'pharmacies', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PharmacyDoc;
}

/** Updates the officine's address in both `pharmacies/{uid}` and `users/{uid}.pharmacyAddress`. */
export async function updatePharmacyAddress(uid: string, address: Address): Promise<void> {
  const displayAddress = `${address.street}, ${address.zipCode} ${address.city}`;
  await Promise.all([
    updateDoc(doc(db, 'pharmacies', uid), { address: displayAddress, addressDetails: address }),
    updateDoc(doc(db, 'users', uid), { pharmacyAddress: address }),
  ]);
}
