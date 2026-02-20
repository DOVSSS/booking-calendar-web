import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const AddBookingModal = React.memo(({ onClose, editBooking, initialDates }) => {
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // только дата, без времени
  };

  const [formData, setFormData] = useState({
    name: editBooking?.name || '',
    phone: editBooking?.phone || '',
    startDate: editBooking?.startDate ? formatDateForInput(editBooking.startDate) : (initialDates?.start ? formatDateForInput(initialDates.start) : ''),
    endDate: editBooking?.endDate ? formatDateForInput(editBooking.endDate) : (initialDates?.end ? formatDateForInput(initialDates.end) : ''),
    guests: editBooking?.guests || 1,
    comment: editBooking?.comment || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkOverlap = useCallback(async (start, end, excludeId = null) => {
    try {
      const q = query(collection(db, 'bookings'));
      const snapshot = await getDocs(q);
      return snapshot.docs.some(doc => {
        if (excludeId && doc.id === excludeId) return false;
        const b = doc.data();
        const bStart = b.startDate.toDate();
        const bEnd = b.endDate.toDate();
        return start < bEnd && end > bStart;
      });
    } catch (err) {
      console.error('Overlap check error:', err);
      return false;
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Создаём даты из строк (только дата, без времени)
      const startDate = new Date(formData.startDate + 'T14:00:00'); // заезд в 14:00
      const endDate = new Date(formData.endDate + 'T11:00:00');     // выезд в 11:00

      // Проверка, что endDate не меньше startDate
      if (endDate <= startDate) {
        throw new Error('Дата выезда должна быть позже даты заезда');
      }

      // Проверка минимального срока — 1 ночь (20 часов, с запасом)
      const minStay = 20 * 60 * 60 * 1000; // 20 часов (с 14:00 до 11:00 следующего дня — это 21 час)
      if (endDate - startDate < minStay) {
        throw new Error('Минимальный срок бронирования — 1 ночь');
      }

      // Проверка пересечений
      const hasOverlap = await checkOverlap(startDate, endDate, editBooking?.id);
      if (hasOverlap) {
        throw new Error('Это время уже занято');
      }

      const bookingData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        guests: Number(formData.guests),
        comment: formData.comment.trim() || '',
        createdAt: editBooking?.createdAt
          ? (typeof editBooking.createdAt === 'object' ? editBooking.createdAt : Timestamp.fromDate(new Date(editBooking.createdAt)))
          : Timestamp.now()
      };

      if (editBooking) {
        await updateDoc(doc(db, 'bookings', editBooking.id), bookingData);
      } else {
        await addDoc(collection(db, 'bookings'), bookingData);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {editBooking ? 'Редактировать бронь' : 'Новая бронь'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата заезда *</label>
            <input
              type="date"
              name="startDate"
              required
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Заезд в 14:00</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата выезда *</label>
            <input
              type="date"
              name="endDate"
              required
              value={formData.endDate}
              min={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Выезд до 11:00</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Количество гостей *</label>
            <input
              type="number"
              name="guests"
              required
              min="1"
              max="10"
              value={formData.guests}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
            <textarea
              name="comment"
              rows="3"
              value={formData.comment}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : (editBooking ? 'Сохранить' : 'Добавить')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

AddBookingModal.displayName = 'AddBookingModal';
export default AddBookingModal;