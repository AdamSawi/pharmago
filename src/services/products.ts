import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface ProductDoc {
  id: string;
  name: string;
  description?: string;
  price: number;
  requiresOrdonnance: boolean;
  pharmacyId: string;
  stock: number;
}

const productsCol = collection(db, 'products');

export function listenPharmacyProducts(
  pharmacyId: string,
  onData: (products: ProductDoc[]) => void,
): Unsubscribe {
  const q = query(productsCol, where('pharmacyId', '==', pharmacyId));
  return onSnapshot(q, (snap) => {
    try {
      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductDoc));
      products.sort((a, b) => a.name.localeCompare(b.name));
      onData(products);
    } catch (err) {
      console.error('listenPharmacyProducts processing error:', err);
    }
  }, (err) => console.error('listenPharmacyProducts listener error:', err));
}

export async function addProduct(data: {
  pharmacyId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  requiresOrdonnance: boolean;
}): Promise<string> {
  const ref = await addDoc(productsCol, data);
  return ref.id;
}

export async function updateProduct(
  productId: string,
  data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    requiresOrdonnance: boolean;
  },
): Promise<void> {
  await updateDoc(doc(db, 'products', productId), data);
}

export async function decrementStock(productId: string, quantity: number): Promise<void> {
  await updateDoc(doc(db, 'products', productId), { stock: increment(-quantity) });
}

export async function incrementStock(productId: string, quantity: number): Promise<void> {
  await updateDoc(doc(db, 'products', productId), { stock: increment(quantity) });
}

export async function deleteProducts(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, 'products', id)));
  await batch.commit();
}
