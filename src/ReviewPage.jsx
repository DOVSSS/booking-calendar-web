import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase/config';

const ReviewPage = () => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name.trim()) {
        throw new Error('Введите ваше имя');
      }
      if (!text.trim()) {
        throw new Error('Напишите отзыв или пожелание');
      }

      await addDoc(collection(db, 'reviews'), {
        name: name.trim(),
        rating: rating,
        text: text.trim(),
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Спасибо за отзыв!</h2>
          <p className="text-gray-600">Ваше мнение очень важно для нас. Мы обязательно учтём ваши пожелания.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Оставить отзыв</h1>
          <p className="text-gray-500 text-sm mt-1">Поделитесь впечатлениями о проживании</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Оценка</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Отзыв или пожелание *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Напишите, что вам понравилось или что можно улучшить..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Отправка...' : '✉️ Отправить отзыв'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewPage;