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
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    name: editBooking?.name || '',
    phone: editBooking?.phone || '',
    startDate: editBooking?.startDate ? formatDateForInput(editBooking.startDate) : (initialDates?.start ? formatDateForInput(initialDates.start) : ''),
    endDate: editBooking?.endDate ? formatDateForInput(editBooking.endDate) : (initialDates?.end ? formatDateForInput(initialDates.end) : ''),
    prepayment: editBooking?.prepayment !== undefined ? editBooking.prepayment : 0,
    finalPayment: editBooking?.finalPayment !== undefined ? editBooking.finalPayment : 0,
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

  // Функция для безопасного преобразования в число
  const safeParseNumber = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    // Если это уже число, возвращаем его
    if (typeof value === 'number') return value;
    // Удаляем все пробелы и заменяем запятую на точку
    const cleanValue = String(value).replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : Math.floor(parsed); // отбрасываем копейки
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const startDate = new Date(formData.startDate + 'T14:00:00');
      const endDate = new Date(formData.endDate + 'T11:00:00');

      if (endDate <= startDate) {
        throw new Error('Дата выезда должна быть позже даты заезда');
      }

      const minStay = 20 * 60 * 60 * 1000;
      if (endDate - startDate < minStay) {
        throw new Error('Минимальный срок бронирования — 1 ночь');
      }

      const hasOverlap = await checkOverlap(startDate, endDate, editBooking?.id);
      if (hasOverlap) {
        throw new Error('Это время уже занято');
      }

      // ✅ БЕЗОПАСНОЕ ПРЕОБРАЗОВАНИЕ СУММ
      const prepaymentAmount = safeParseNumber(formData.prepayment);
      const finalPaymentAmount = safeParseNumber(formData.finalPayment);

      console.log('💰 Сохраняемые суммы:', {
        исходная_предоплата: formData.prepayment,
        преобразованная_предоплата: prepaymentAmount,
        исходная_доплата: formData.finalPayment,
        преобразованная_доплата: finalPaymentAmount
      });

      const bookingData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        prepayment: prepaymentAmount,
        finalPayment: finalPaymentAmount,
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
    
    // Для числовых полей очищаем от нечисловых символов
    if (name === 'prepayment' || name === 'finalPayment') {
      // Разрешаем только цифры
      const cleanValue = value.replace(/[^\d]/g, '');
      setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Предоплата (₽)
            </label>
            <input
              type="text"
              name="prepayment"
              inputMode="numeric"
              value={formData.prepayment}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Только цифры</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Доплата при въезде (₽)
            </label>
            <input
              type="text"
              name="finalPayment"
              inputMode="numeric"
              value={formData.finalPayment}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Только цифры</p>
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