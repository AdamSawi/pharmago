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
import type { Address } from '@/services/auth';
import { decrementStock, incrementStock } from '@/services/products';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'in_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Ordonnance {
  title: string;
  base64: string;
  type: 'image' | 'pdf';
  name: string;
}

export interface FirestoreOrder {
  id: string;
  clientId: string;
  clientName: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string | null;
  deliveryAddress: Address | null;
  deliveryId: string | null;
  deliveryCode: string | null;
  status: OrderStatus;
  items: OrderItem[];
  totalPrice: number;
  deliveryFee: number;
  hasOrdonnance: boolean;
  ordonnances: Ordonnance[];
  refusalReason: string | null;
  createdAt: { toMillis: () => number } | null;
  updatedAt: { toMillis: () => number } | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
}

const ordersCol = collection(db, 'orders');

// ─── PHARMACY ─────────────────────────────────────────────────────────────────

export function listenPharmacyOrders(
  pharmacyId: string,
  onData: (orders: FirestoreOrder[]) => void,
): Unsubscribe {
  // No orderBy to avoid composite index requirement — sorted client-side
  const q = query(
    ordersCol,
    where('pharmacyId', '==', pharmacyId),
    where('status', 'in', ['pending', 'accepted', 'in_delivery']),
  );
  return onSnapshot(q, (snap) => {
    try {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
      orders.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      onData(orders);
    } catch (err) {
      console.error('listenPharmacyOrders processing error:', err);
    }
  }, (err) => console.error('listenPharmacyOrders listener error:', err));
}

export async function acceptOrder(orderId: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });
  // Stock already decremented at placeOrder — nothing to do here
}

export async function rejectOrder(orderId: string, reason?: string): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);

  await updateDoc(orderRef, {
    status: 'rejected',
    refusalReason: reason ?? null,
    updatedAt: serverTimestamp(),
  });

  // Restore stock since order was rejected
  if (orderSnap.exists()) {
    const order = { id: orderSnap.id, ...orderSnap.data() } as FirestoreOrder;
    if (order.items?.length) {
      await Promise.all(
        order.items
          .filter((i) => i.productId)
          .map((i) => incrementStock(i.productId!, i.quantity)),
      );
    }
  }
}

export async function cancelOrder(orderId: string): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);

  await updateDoc(orderRef, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });

  // Restore stock since client cancelled the order
  if (orderSnap.exists()) {
    const order = { id: orderSnap.id, ...orderSnap.data() } as FirestoreOrder;
    if (order.items?.length) {
      await Promise.all(
        order.items
          .filter((i) => i.productId)
          .map((i) => incrementStock(i.productId!, i.quantity)),
      );
    }
  }
}

// ─── CLIENT ───────────────────────────────────────────────────────────────────

export async function placeOrder(data: {
  clientId: string;
  clientName: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress?: string | null;
  deliveryAddress?: Address | null;
  items: OrderItem[];
  totalPrice: number;
  deliveryFee: number;
  hasOrdonnance: boolean;
  ordonnances?: Ordonnance[];
}): Promise<string> {
  const ref = await addDoc(ordersCol, {
    ...data,
    pharmacyAddress: data.pharmacyAddress ?? null,
    deliveryAddress: data.deliveryAddress ?? null,
    deliveryId: null,
    deliveryCode: null,
    status: 'pending' as OrderStatus,
    ordonnances: data.ordonnances ?? [],
    refusalReason: null,
    deliveryLat: null,
    deliveryLng: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Decrement stock immediately on order placement (payment confirmed)
  if (data.items?.length) {
    await Promise.all(
      data.items
        .filter((i) => i.productId)
        .map((i) => decrementStock(i.productId!, i.quantity)),
    );
  }

  return ref.id;
}

export function listenClientOrders(
  clientId: string,
  onData: (orders: FirestoreOrder[]) => void,
): Unsubscribe {
  const q = query(ordersCol, where('clientId', '==', clientId));
  return onSnapshot(q, (snap) => {
    try {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
      orders.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      onData(orders);
    } catch (err) {
      console.error('listenClientOrders processing error:', err);
    }
  }, (err) => console.error('listenClientOrders listener error:', err));
}

export function listenClientOrder(
  orderId: string,
  onData: (order: FirestoreOrder) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    try {
      if (snap.exists()) onData({ id: snap.id, ...snap.data() } as FirestoreOrder);
    } catch (err) {
      console.error('listenClientOrder processing error:', err);
    }
  }, (err) => console.error('listenClientOrder listener error:', err));
}

// ─── DELIVERY ─────────────────────────────────────────────────────────────────

export function listenAvailableDeliveries(
  onData: (orders: FirestoreOrder[]) => void,
): Unsubscribe {
  // Two separate where clauses — no composite index needed without orderBy
  const q = query(ordersCol, where('status', '==', 'accepted'));
  return onSnapshot(q, (snap) => {
    try {
      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder))
        .filter((o) => o.deliveryId === null);
      orders.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      onData(orders);
    } catch (err) {
      console.error('listenAvailableDeliveries processing error:', err);
    }
  }, (err) => console.error('listenAvailableDeliveries listener error:', err));
}

export async function claimDelivery(orderId: string, deliveryId: string): Promise<void> {
  const deliveryCode = String(Math.floor(1000 + Math.random() * 9000));
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'in_delivery',
    deliveryId,
    deliveryCode,
    updatedAt: serverTimestamp(),
  });
}

export async function markDelivered(orderId: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'delivered',
    updatedAt: serverTimestamp(),
  });
}

export function listenDeliveryEarningsWeek(
  deliveryId: string,
  onData: (data: { earnings: number; count: number }) => void,
): Unsubscribe {
  const q = query(
    ordersCol,
    where('deliveryId', '==', deliveryId),
    where('status', '==', 'delivered'),
  );
  return onSnapshot(q, (snap) => {
    try {
      const startOfWeek = new Date();
      const dayOffset = (startOfWeek.getDay() + 6) % 7; // Monday = 0
      startOfWeek.setDate(startOfWeek.getDate() - dayOffset);
      startOfWeek.setHours(0, 0, 0, 0);
      const weekOrders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder))
        .filter((o) => (o.updatedAt?.toMillis() ?? 0) >= startOfWeek.getTime());
      const earnings = weekOrders.reduce((acc, o) => acc + (o.deliveryFee ?? 0), 0);
      onData({ earnings, count: weekOrders.length });
    } catch (err) {
      console.error('listenDeliveryEarningsWeek processing error:', err);
    }
  }, (err) => console.error('listenDeliveryEarningsWeek listener error:', err));
}

export function listenDeliveryEarningsMonth(
  deliveryId: string,
  onData: (data: { earnings: number; count: number }) => void,
): Unsubscribe {
  const q = query(
    ordersCol,
    where('deliveryId', '==', deliveryId),
    where('status', '==', 'delivered'),
  );
  return onSnapshot(q, (snap) => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthOrders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder))
        .filter((o) => (o.updatedAt?.toMillis() ?? 0) >= startOfMonth.getTime());
      const earnings = monthOrders.reduce((acc, o) => acc + (o.deliveryFee ?? 0), 0);
      onData({ earnings, count: monthOrders.length });
    } catch (err) {
      console.error('listenDeliveryEarningsMonth processing error:', err);
    }
  }, (err) => console.error('listenDeliveryEarningsMonth listener error:', err));
}

export function listenPharmacyHistory(
  pharmacyId: string,
  onData: (orders: FirestoreOrder[]) => void,
): Unsubscribe {
  const q = query(
    ordersCol,
    where('pharmacyId', '==', pharmacyId),
    where('status', 'in', ['delivered', 'rejected', 'cancelled']),
  );
  return onSnapshot(q, (snap) => {
    try {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
      orders.sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
      onData(orders);
    } catch (err) {
      console.error('listenPharmacyHistory processing error:', err);
    }
  }, (err) => console.error('listenPharmacyHistory listener error:', err));
}

export function listenDeliveryEarningsToday(
  deliveryId: string,
  onData: (data: { earnings: number; count: number }) => void,
): Unsubscribe {
  const q = query(
    ordersCol,
    where('deliveryId', '==', deliveryId),
    where('status', '==', 'delivered'),
  );
  return onSnapshot(q, (snap) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayOrders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder))
        .filter((o) => (o.updatedAt?.toMillis() ?? 0) >= startOfDay.getTime());
      const earnings = todayOrders.reduce((acc, o) => acc + (o.deliveryFee ?? 0), 0);
      onData({ earnings, count: todayOrders.length });
    } catch (err) {
      console.error('listenDeliveryEarningsToday processing error:', err);
    }
  }, (err) => console.error('listenDeliveryEarningsToday listener error:', err));
}

export async function getClientStats(
  clientId: string,
): Promise<{ orderCount: number; totalSpent: number; favoritePharmacy: string | null }> {
  const snap = await getDocs(query(ordersCol, where('clientId', '==', clientId), where('status', '==', 'delivered')));
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
  const totalSpent = orders.reduce((acc, o) => acc + (o.totalPrice ?? 0), 0);
  const countByPharmacy = new Map<string, number>();
  for (const o of orders) {
    countByPharmacy.set(o.pharmacyName, (countByPharmacy.get(o.pharmacyName) ?? 0) + 1);
  }
  let favoritePharmacy: string | null = null;
  let maxCount = 0;
  for (const [name, count] of countByPharmacy) {
    if (count > maxCount) {
      maxCount = count;
      favoritePharmacy = name;
    }
  }
  return { orderCount: orders.length, totalSpent, favoritePharmacy };
}

export async function getPharmacyStats(
  pharmacyId: string,
): Promise<{ orderCount: number; totalRevenue: number }> {
  const snap = await getDocs(query(ordersCol, where('pharmacyId', '==', pharmacyId), where('status', '==', 'delivered')));
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPrice ?? 0), 0);
  return { orderCount: orders.length, totalRevenue };
}

export async function getDeliveryStats(
  deliveryId: string,
): Promise<{ totalDeliveries: number; totalEarnings: number }> {
  const snap = await getDocs(query(ordersCol, where('deliveryId', '==', deliveryId), where('status', '==', 'delivered')));
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
  const totalEarnings = orders.reduce((acc, o) => acc + (o.deliveryFee ?? 0), 0);
  return { totalDeliveries: orders.length, totalEarnings };
}

export function listenDeliveryHistory(
  deliveryId: string,
  onData: (orders: FirestoreOrder[]) => void,
): Unsubscribe {
  const q = query(ordersCol, where('deliveryId', '==', deliveryId), where('status', '==', 'delivered'));
  return onSnapshot(q, (snap) => {
    try {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
      orders.sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
      onData(orders);
    } catch (err) {
      console.error('listenDeliveryHistory processing error:', err);
    }
  }, (err) => console.error('listenDeliveryHistory listener error:', err));
}

export function listenActiveDelivery(
  deliveryId: string,
  onData: (order: FirestoreOrder | null) => void,
): Unsubscribe {
  const q = query(
    ordersCol,
    where('deliveryId', '==', deliveryId),
    where('status', '==', 'in_delivery'),
  );
  return onSnapshot(q, (snap) => {
    try {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
      onData(orders[0] ?? null);
    } catch (err) {
      console.error('listenActiveDelivery processing error:', err);
    }
  }, (err) => console.error('listenActiveDelivery listener error:', err));
}
