// ReviewsWidget.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const ReviewsWidget = ({ className }) => {
  const [reviews, setReviews] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, average: 0 });

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setReviews(reviewsData);
      const total = reviewsData.length;
      const avg = total > 0 ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      setStats({ total, average: Math.round(avg * 10) / 10 });
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const isMobile = window.innerWidth < 768;

  return (
    <>
      <div className={`relative ${className || ''}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center gap-1.5 bg-pink-500 hover:bg-pink-600 transition-colors text-white px-3 py-1.5 rounded-lg shadow-md text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" />
          </svg>
          <span>⭐ {stats.total > 0 ? `${stats.average} (${stats.total})` : '0'}</span>
          <svg className={`w-3 h-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <>
            {isMobile ? (
              <div className="fixed inset-0 bg-white z-50 flex flex-col">
                <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-lg">Отзывы</h3>
                  <div className="flex items-center gap-3">
                    {stats.total > 0 && <span className="text-sm text-gray-500">⭐ {stats.average} ({stats.total})</span>}
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {reviews.length === 0 ? <p className="text-gray-500 text-center py-8">Пока нет отзывов</p> : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-800">{review.name}</span>
                              <div className="text-yellow-400 text-lg">{renderStars(review.rating)}</div>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDate(review.createdAt)}</span>
                          </div>
                          <p className="text-gray-600 mt-2">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute top-full right-0 mt-1 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border z-50 max-h-[80vh] overflow-hidden">
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-3 sticky top-0 bg-white py-1 z-10">
                    <h3 className="font-semibold text-gray-800 text-sm">Отзывы</h3>
                    {stats.total > 0 && <span className="text-xs text-gray-500">⭐ {stats.average} ({stats.total})</span>}
                  </div>
                  {reviews.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">Пока нет отзывов</p> : (
                    <div className="space-y-3">
                      {reviews.slice(0, 20).map(review => (
                        <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-800 text-sm">{review.name}</span>
                              <div className="text-yellow-400 text-sm">{renderStars(review.rating)}</div>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDate(review.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 break-words">{review.text}</p>
                        </div>
                      ))}
                      {reviews.length > 20 && <p className="text-xs text-gray-400 text-center">Показаны последние 20 отзывов</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ReviewsWidget;