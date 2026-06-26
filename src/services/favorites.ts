import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface FavoriteDoc {
  id: string;
  clientId: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
}

const favoritesCol = collection(db, 'favorites');

export function listenFavorites(
  clientId: string,
  onData: (favorites: FavoriteDoc[]) => void,
): Unsubscribe {
  const q = query(favoritesCol, where('clientId', '==', clientId));
  return onSnapshot(q, (snap) => {
    try {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FavoriteDoc)));
    } catch (err) {
      console.error('listenFavorites processing error:', err);
    }
  }, (err) => console.error('listenFavorites listener error:', err));
}

export async function addFavorite(
  clientId: string,
  pharmacyId: string,
  pharmacyName: string,
  pharmacyAddress: string,
): Promise<void> {
  await addDoc(favoritesCol, { clientId, pharmacyId, pharmacyName, pharmacyAddress });
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  await deleteDoc(doc(db, 'favorites', favoriteId));
}
