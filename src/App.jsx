import React, { lazy, Suspense, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Calendar from './components/Calendar';
import LoginPage from './components/LoginPage';
import { auth, isAdminUser, logout } from './firebase/auth';
import './index.css';

const ReviewPage = lazy(() => import('./ReviewPage'));

function App() {
  // undefined — Firebase ещё проверяет сохранённую сессию
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Страница отзыва доступна без входа
  if (window.location.pathname === '/review') {
    return (
      <Suspense fallback={null}>
        <ReviewPage />
      </Suspense>
    );
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = isAdminUser(user);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="container mx-auto px-4 pt-4 flex justify-end items-center gap-3 text-sm text-gray-600">
        <span>
          {user.email} · {isAdmin ? 'админ' : 'пользователь'}
        </span>
        <button
          type="button"
          onClick={logout}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg transition-colors"
        >
          Выйти
        </button>
      </header>
      <main className="container mx-auto py-6">
        <Calendar isAdmin={isAdmin} />
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} Календарь бронирования домиков
      </footer>
    </div>
  );
}

export default App;
