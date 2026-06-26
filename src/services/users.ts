import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UserRole } from '@/services/auth';

export interface BasicUser {
  uid: string;
  name: string;
  role: UserRole;
}

export async function getUsersByRole(role: UserRole): Promise<BasicUser[]> {
  const snap = await getDocs(query(collection(db, 'users'), where('role', '==', role)));
  return snap.docs.map((d) => ({ uid: d.id, name: d.data().name ?? '—', role }));
}

export async function getUserBasic(uid: string): Promise<BasicUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { uid, name: data.name ?? '—', role: data.role as UserRole };
}
