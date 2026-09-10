import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import ReviewPage from './ReviewPage';
import './index.css';

function App() {
  const [isReviewPage, setIsReviewPage] = useState(false);

  useEffect(() => {
    // Проверяем, открыта ли страница отзыва
    if (window.location.pathname === '/review') {
      setIsReviewPage(true);
    }
  }, []);

  if (isReviewPage) {
    return <ReviewPage />;
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