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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Информация о брони</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Имя:</label>
              <p className="font-medium text-gray-800">{booking.name}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600">Телефон:</label>
              <p className="font-medium text-gray-800">{booking.phone}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600">Заезд:</label>
              <p className="font-medium text-gray-800">{formatDateTime(booking.startDate)}</p>
              <p className="text-xs text-gray-500">(после 14:00)</p>
            </div>

            <div>
              <label className="text-sm text-gray-600">Выезд:</label>
              <p className="font-medium text-gray-800">{formatDateTime(booking.endDate)}</p>
              <p className="text-xs text-gray-500">(до 11:00)</p>
            </div>

            <div className="border-t pt-2 mt-2">
              <label className="text-sm font-semibold text-gray-700">Финансы:</label>
              <div className="mt-1 space-y-1">
                <p className="text-sm">
                  <span className="text-gray-600">Предоплата:</span>{' '}
                  <span className="font-medium text-green-600">{formatMoney(booking.prepayment || 0)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Доплата при въезде:</span>{' '}
                  <span className="font-medium text-blue-600">{formatMoney(booking.finalPayment || 0)}</span>
                </p>
                <p className="text-sm pt-1 border-t">
                  <span className="font-semibold text-gray-700">Общая сумма:</span>{' '}
                  <span className="font-bold text-gray-900">{formatMoney(totalPayment)}</span>
                </p>
              </div>
            </div>

            {booking.comment && (
              <div>
                <label className="text-sm text-gray-600">Комментарий:</label>
                <p className="font-medium text-gray-800 whitespace-pre-wrap">{booking.comment}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleEdit}
              disabled={deleting}
              className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Удаление...' : 'Удалить'}
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