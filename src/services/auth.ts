/**
 * Firebase Auth service — sign in, sign up, sign out
 * All 3 roles (client, pharmacy, delivery) use email/password.
 * After sign-up, the role is stored in Firestore users/{uid}.
 */

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

export type UserRole = 'client' | 'pharmacy' | 'delivery';

export interface Address {
  street: string;
  zipCode: string;
  city: string;
}

export interface ClientAddress extends Address {
  id: string;
  label: string;
  isDefault: boolean;
  recipientFirstName?: string;
  recipientLastName?: string;
}

export type VehicleType = 'velo' | 'scooter' | 'voiture';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  addresses?: ClientAddress[];
  pharmacyAddress?: Address;
  rating?: number;
  phone?: string;
  birthDate?: string;
  siret?: string;
  openingHours?: string;
  isOpen?: boolean;
  vehicleType?: VehicleType;
  deliveryZone?: string;
}

/** Sign in and return the user's role from Firestore */
export async function signIn(email: string, password: string): Promise<AppUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return fetchUserProfile(user);
}

/** Create account with role, store profile in Firestore */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole,
): Promise<AppUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const profile: Omit<AppUser, 'uid'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    email,
    name,
    role,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return { uid: user.uid, email, name, role };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

async function reauthenticate(currentPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Utilisateur non connecté');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

export async function updateName(uid: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { name });
}

export async function changeEmail(currentPassword: string, newEmail: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilisateur non connecté');
  await reauthenticate(currentPassword);
  await firebaseUpdateEmail(user, newEmail);
  await updateDoc(doc(db, 'users', user.uid), { email: newEmail });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilisateur non connecté');
  await reauthenticate(currentPassword);
  await firebaseUpdatePassword(user, newPassword);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function fetchUserProfile(user: User): Promise<AppUser> {
  // Right after signUp(), the auth state listener can fire before the
  // users/{uid} doc finishes writing — retry briefly instead of failing.
  let snap = await getDoc(doc(db, 'users', user.uid));
  for (let attempt = 0; !snap.exists() && attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    snap = await getDoc(doc(db, 'users', user.uid));
  }
  if (!snap.exists()) throw new Error('Profil utilisateur introuvable');
  const data = snap.data();
  return {
    uid: user.uid,
    email: user.email ?? '',
    name: data.name,
    role: data.role as UserRole,
    addresses: data.addresses as ClientAddress[] | undefined,
    pharmacyAddress: data.pharmacyAddress as Address | undefined,
    rating: data.rating as number | undefined,
    phone: data.phone as string | undefined,
    birthDate: data.birthDate as string | undefined,
    siret: data.siret as string | undefined,
    openingHours: data.openingHours as string | undefined,
    isOpen: data.isOpen as boolean | undefined,
    vehicleType: data.vehicleType as VehicleType | undefined,
    deliveryZone: data.deliveryZone as string | undefined,
  };
}

export async function updateProfileFields(uid: string, data: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}
