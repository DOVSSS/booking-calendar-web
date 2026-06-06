import React, { useState, useCallback } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AddBookingModal from './AddBookingModal';

const BookingModal = React.memo(({ booking, onClose }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amount);
  };

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Вы уверены, что хотите удалить эту бронь?')) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'bookings', booking.id));
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Ошибка при удалении: ' + error.message);
    } finally {
      setDeleting(false);
    }
  }, [booking, onClose]);

  const handleEdit = useCallback(() => setShowEditModal(true), []);

  const totalPayment = (booking.prepayment || 0) + (booking.finalPayment || 0);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
        <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Информация о брони</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Имя */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Имя</label>
              <p className="font-medium text-gray-800 text-base mt-1">{booking.name}</p>
            </div>

            {/* Телефон */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Телефон</label>
              <p className="font-medium text-gray-800 text-base mt-1">{booking.phone}</p>
            </div>

            {/* Заезд */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Заезд</label>
              <p className="font-medium text-gray-800 text-base mt-1">{formatDateTime(booking.startDate)}</p>
              <p className="text-xs text-gray-400 mt-1">(после 14:00)</p>
            </div>

            {/* Выезд */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Выезд</label>
              <p className="font-medium text-gray-800 text-base mt-1">{formatDateTime(booking.endDate)}</p>
              <p className="text-xs text-gray-400 mt-1">(до 11:00)</p>
            </div>

            {/* Финансы */}
            <div className="bg-blue-50 rounded-lg p-3">
              <label className="text-xs text-blue-600 uppercase tracking-wider">Финансы</label>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Предоплата:</span>
                  <span className="font-medium text-green-600">{formatMoney(booking.prepayment || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Доплата при въезде:</span>
                  <span className="font-medium text-blue-600">{formatMoney(booking.finalPayment || 0)}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Общая сумма:</span>
                  <span className="font-bold text-gray-900">{formatMoney(totalPayment)}</span>
                </div>
              </div>
            </div>

            {/* Комментарий */}
            {booking.comment && (
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Комментарий</label>
                <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap break-words">{booking.comment}</p>
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
            <button
              onClick={handleEdit}
              disabled={deleting}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              ✏️ Редактировать
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {deleting ? '🗑️ Удаление...' : '🗑️ Удалить'}
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <AddBookingModal
          onClose={() => {
            setShowEditModal(false);
            onClose();
          }}
          editBooking={booking}
        />
      )}
    </>
  );
});

BookingModal.displayName = 'BookingModal';
export default BookingModal;