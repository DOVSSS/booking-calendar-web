import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './config';

// Функция входа
export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Проверяем claims сразу после входа
    const tokenResult = await userCredential.user.getIdTokenResult();
    console.log('User claims after login:', tokenResult.claims);
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: error.message };
  }
};

// Функция выхода
export const logoutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Функция проверки прав администратора
export const checkIsAdmin = async (user) => {
  if (!user) return false;
  try {
    const tokenResult = await user.getIdTokenResult(true); // true = force refresh
    console.log('Checking admin status:', tokenResult.claims);
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Функция для принудительного обновления токена
export const refreshToken = async (user) => {
  if (!user) return false;
  try {
    await user.getIdToken(true); // true = force refresh
    const tokenResult = await user.getIdTokenResult();
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};