import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './config';

export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const logoutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkIsAdmin = async (user) => {
  if (!user) return false;
  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims.admin === true;
};