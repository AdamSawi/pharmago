import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface ReviewDoc {
  id: string;
  orderId: string;
  clientId: string;
  clientName: string;
  deliveryId: string;
  rating: number;
  comment: string;
  deliveryResponse: string | null;
  deliveryResponseAt: { toMillis: () => number } | null;
  createdAt: { toMillis: () => number } | null;
}

const reviewsCol = collection(db, 'reviews');

export function listenDeliveryReviews(
  deliveryId: string,
  onData: (reviews: ReviewDoc[]) => void,
): Unsubscribe {
  const q = query(reviewsCol, where('deliveryId', '==', deliveryId));
  return onSnapshot(q, (snap) => {
    try {
      const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReviewDoc));
      reviews.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      onData(reviews);
    } catch (err) {
      console.error('listenDeliveryReviews processing error:', err);
    }
  }, (err) => console.error('listenDeliveryReviews listener error:', err));
}

export async function getReviewForOrder(orderId: string): Promise<ReviewDoc | null> {
  const snap = await getDocs(query(reviewsCol, where('orderId', '==', orderId)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as ReviewDoc;
}

export async function addReview(data: {
  orderId: string;
  clientId: string;
  clientName: string;
  deliveryId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  await addDoc(reviewsCol, {
    ...data,
    deliveryResponse: null,
    deliveryResponseAt: null,
    createdAt: serverTimestamp(),
  });

  // Recompute the delivery person's average rating
  const snap = await getDocs(query(reviewsCol, where('deliveryId', '==', data.deliveryId)));
  const ratings = snap.docs.map((d) => d.data().rating as number);
  const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  await updateDoc(doc(db, 'users', data.deliveryId), { rating: Math.round(average * 10) / 10 });
}

export async function respondToReview(reviewId: string, responseText: string): Promise<void> {
  await updateDoc(doc(db, 'reviews', reviewId), {
    deliveryResponse: responseText.trim(),
    deliveryResponseAt: serverTimestamp(),
  });
}

export async function getDeliveryProfile(
  deliveryId: string,
): Promise<{ name: string; rating: number } | null> {
  const snap = await getDoc(doc(db, 'users', deliveryId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { name: data.name ?? '—', rating: data.rating ?? 5 };
}
