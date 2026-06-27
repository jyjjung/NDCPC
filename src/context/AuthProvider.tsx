'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/LocaleProvider';
import { ensureUserProfile, isBootstrapAdminEmail } from '@/lib/users';
import type { UserProfile } from '@/lib/types';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isBootstrapAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profileDoc, isLoading: profileLoading } = useDoc<UserProfile>(profileRef);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await ensureUserProfile(firestore, nextUser);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [auth, firestore]);

  const profile = profileDoc;
  const isLoading = authLoading || (!!user && profileLoading);
  const isApproved = !!profile?.approved;
  const isAdmin = isApproved && profile?.role === 'admin';
  const isBootstrapAdmin = isAdmin && isBootstrapAdminEmail(profile?.email ?? '');

  const signIn = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: displayName.trim() });
      await ensureUserProfile(firestore, credential.user, displayName.trim());
    },
    [auth, firestore]
  );

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    toast({ title: t('auth.signedOut') });
    router.push('/welcome');
  }, [auth, router, t, toast]);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isApproved,
      isAdmin,
      isBootstrapAdmin,
      signIn,
      signUp,
      signOutUser,
    }),
    [user, profile, isLoading, isApproved, isAdmin, isBootstrapAdmin, signIn, signUp, signOutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAdmin() {
  const { isAdmin, isLoading } = useAuth();
  return { isAdmin, isLoading };
}
