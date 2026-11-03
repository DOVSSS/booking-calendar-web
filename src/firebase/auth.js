import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);

const ADMIN_EMAILS = [
  'baza_residence@mail.re',
  ...(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
];

export const isAdminUser = (user) =>
  Boolean(user?.email) && ADMIN_EMAILS.includes(user.email.toLowerCase());

const LOGIN_ERRORS = {
  'auth/invalid-credential': 'Неверный email или пароль',
  'auth/invalid-email': 'Некорректный email',
  'auth/user-disabled': 'Пользователь заблокирован',
  'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
  'auth/network-request-failed': 'Нет соединения с интернетом',
};

export const login = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    return { error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { error: LOGIN_ERRORS[error.code] || 'Не удалось войти' };
  }
};

export const logout = () => signOut(auth);
