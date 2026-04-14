import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../core/firebase';

export type AuthUser = User;

/** Sign in anonymously (auto-creates account, upgradeable later) */
export async function signInAnon(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/** Sign in with email/password */
export async function signInEmail(
  email: string,
  password: string
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Create account with email/password */
export async function signUpEmail(
  email: string,
  password: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Sign in with Google */
export async function signInGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/** Sign in with Apple */
export async function signInApple(): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/** Upgrade anonymous account to email/password */
export async function linkAnonymousToEmail(
  email: string,
  password: string
): Promise<User> {
  const user = auth.currentUser;
  if (!user || !user.isAnonymous) throw new Error('No anonymous user to link');
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(user, credential);
  return result.user;
}

/** Sign out */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/** Get current user (null if not signed in) */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/** Subscribe to auth state changes */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
