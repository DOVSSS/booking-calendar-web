import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const AddBookingModal = ({ isAdmin, onClose, editBooking, initialDates }) => {
  const [formData, setFormData] = useState({
    name: editBooking?.name || '',
    phone: editBooking?.phone || '',
    startDate: editBooking?.startDate ? new Date(editBooking.startDate).toISOString().split('T')[0] : initialDates?.start?.toISOString().split('T')[0] || '',
    endDate: editBooking?.endDate ? new Date(editBooking.endDate).toISOString().split('T')[0] : initialDates?.end?.toISOString().split('T')[0] || '',
    guests: editBooking?.guests || 1,
    comment: editBooking?.comment || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      onClose();
    }
  }, [isAdmin, onClose]);

  const checkDateOverlap = async (startDate, endDate, excludeId = null) => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef);
      const snapshot = await getDocs(q);
      
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      
      // Устанавливаем время в начало дня для корректного сравнения
      newStart.setHours(0, 0, 0, 0);
      newEnd.setHours(23, 59, 59, 999);
      
      return snapshot.docs.some(doc => {
        if (excludeId && doc.id === excludeId) return false;
        
        const booking = doc.data();
        const bookingStart = booking.startDate.toDate();
        const bookingEnd = booking.endDate.toDate();
        
        // Проверяем пересечение дат
        return (newStart <= bookingEnd && newEnd >= bookingStart);
      });
    } catch (error) {
      console.error("Error checking overlap:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Валидация дат
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError('Неверный формат даты');
        setLoading(false);
        return;
      }

      if (endDate <= startDate) {
        setError('Дата окончания должна быть позже даты начала');
        setLoading(false);
        return;
      }

      // Проверка на прошедшие даты (только для новых броней)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!editBooking && startDate < today) {
        setError('Нельзя создать бронь на прошедшую дату');
        setLoading(false);
        return;
      }

      // Проверка пересечения
      const hasOverlap = await checkDateOverlap(startDate, endDate, editBooking?.id);
      if (hasOverlap) {
        setError('Выбранные даты пересекаются с существующей бронью');
        setLoading(false);
        return;
      }

      // Подготовка данных для сохранения
      const bookingData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        guests: Number(formData.guests),
        comment: formData.comment.trim() || '',
        createdAt: editBooking?.createdAt ? 
          (typeof editBooking.createdAt === 'object' ? editBooking.createdAt : Timestamp.fromDate(new Date(editBooking.createdAt))) : 
          Timestamp.now()
      };

      console.log('Saving booking:', bookingData);

      if (editBooking) {
        // Обновление существующей брони
        await updateDoc(doc(db, 'bookings', editBooking.id), bookingData);
        console.log('Booking updated successfully');
      } else {
        // Создание новой брони
        await addDoc(collection(db, 'bookings'), bookingData);
        console.log('Booking added successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving booking:', error);
      setError('Ошибка при сохранении: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {editBooking ? 'Редактировать бронь' : 'Новая бронь'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя *
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон *
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата заезда *
            </label>
            <input
              type="date"
              name="startDate"
              required
              value={formData.startDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата выезда *
            </label>
            <input
              type="date"
              name="endDate"
              required
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество гостей *
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий
            </label>
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
};

export default AddBookingModal;