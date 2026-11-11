import React, { lazy, Suspense, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Calendar from './components/Calendar';
import LoginPage from './components/LoginPage';
import BrandLogo from './components/BrandLogo';
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
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center gap-4 text-brand-silver">
        <BrandLogo size="lg" />
        <div>Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = isAdminUser(user);

  return (
    <div className="min-h-screen bg-brand-dark">
      <header className="bg-brand-charcoal border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-3 text-sm text-brand-muted">
            <span>
              {user.email} · {isAdmin ? 'админ' : 'пользователь'}
            </span>
            <button
              type="button"
              onClick={logout}
              className="bg-white/10 hover:bg-white/20 text-brand-silver px-3 py-1 rounded-lg transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6">
        <Calendar isAdmin={isAdmin} />
      </main>
      <footer className="text-center py-4 text-brand-muted text-sm">
        © {new Date().getFullYear()} RESIDENCE · база отдыха
      </footer>
    </div>
  );
}

export default App;
