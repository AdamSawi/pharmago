/**
 * useAuth — global auth state hook
 * Wraps Firebase onAuthStateChanged and loads the user profile from Firestore.
 * Returns null while loading (show splash/skeleton).
 */

import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import { fetchUserProfile, type AppUser } from '@/services/auth';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ user: null, loading: false });
        return;
      }
      try {
        const profile = await fetchUserProfile(firebaseUser);
        setState({ user: profile, loading: false });
      } catch {
        setState({ user: null, loading: false });
      }
    });
    return unsub;
  }, []);

  return state;
}
