import React, { lazy, Suspense } from 'react';
import Calendar from './components/Calendar';
import './index.css';

const ReviewPage = lazy(() => import('./ReviewPage'));

function App() {
  // Проверяем, открыта ли страница отзыва
  if (window.location.pathname === '/review') {
    return (
      <Suspense fallback={null}>
        <ReviewPage />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-6">
        <Calendar />
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} Календарь бронирования домиков
      </footer>
    </div>
  );
}

export default App;
