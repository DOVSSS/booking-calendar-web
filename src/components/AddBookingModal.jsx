import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const AddBookingModal = React.memo(({ onClose, editBooking, initialDates, houseId }) => {
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

  const effectiveHouseId = houseId || editBooking?.houseId;

  const checkOverlap = useCallback(async (start, end, excludeId = null) => {
    try {
      if (!effectiveHouseId) return false;
      const q = query(collection(db, 'bookings'), where('houseId', '==', effectiveHouseId));
      const snapshot = await getDocs(q);
      return snapshot.docs.some((docSnap) => {
        if (excludeId && docSnap.id === excludeId) return false;
        const b = docSnap.data();
        const bStart = b.startDate.toDate();
        const bEnd = b.endDate.toDate();
        return start < bEnd && end > bStart;
      });
    } catch (err) {
      console.error('Overlap check error:', err);
      return false;
    }
  }, [effectiveHouseId]);

  const safeParseNumber = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleanValue = String(value).replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : Math.floor(parsed);
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

      const prepaymentAmount = safeParseNumber(formData.prepayment);
      const finalPaymentAmount = safeParseNumber(formData.finalPayment);

      if (!effectiveHouseId) {
        throw new Error('Не выбран домик');
      }

      const bookingData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        prepayment: prepaymentAmount,
        finalPayment: finalPaymentAmount,
        comment: formData.comment.trim() || '',
        houseId: effectiveHouseId,
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
    if (name === 'prepayment' || name === 'finalPayment') {
      const cleanValue = value.replace(/[^\d]/g, '');
      setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {editBooking ? 'Редактировать бронь' : 'Новая бронь'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Введите имя"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="+7 900 123-45-67"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">🕐 Заезд в 14:00</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">🕐 Выезд до 11:00</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Предоплата (₽)</label>
            <input
              type="text"
              name="prepayment"
              inputMode="numeric"
              value={formData.prepayment}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Доплата при въезде (₽)</label>
            <input
              type="text"
              name="finalPayment"
              inputMode="numeric"
              value={formData.finalPayment}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
            <textarea
              name="comment"
              rows="3"
              value={formData.comment}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
              placeholder="Дополнительная информация..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? '💾 Сохранение...' : (editBooking ? '💾 Сохранить' : '➕ Добавить')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              ❌ Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

AddBookingModal.displayName = 'AddBookingModal';
export default AddBookingModal;