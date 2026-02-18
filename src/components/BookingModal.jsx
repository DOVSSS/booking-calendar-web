import { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AddBookingModal from './AddBookingModal';

const BookingModal = ({ booking, isAdmin, onClose }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить эту бронь?')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'bookings', booking.id));
      console.log('Booking deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Ошибка при удалении: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Информация о брони</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
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
              <label className="text-sm text-gray-600">Даты проживания:</label>
              <p className="font-medium text-gray-800">
                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
              </p>
            </div>

            {isAdmin && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Телефон:</label>
                  <p className="font-medium text-gray-800">{booking.phone}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Количество гостей:</label>
                  <p className="font-medium text-gray-800">{booking.guests}</p>
                </div>

                {booking.comment && (
                  <div>
                    <label className="text-sm text-gray-600">Комментарий:</label>
                    <p className="font-medium text-gray-800 whitespace-pre-wrap">{booking.comment}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(true)}
                disabled={deleting}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                Редактировать
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <AddBookingModal
          isAdmin={isAdmin}
          onClose={() => {
            setShowEditModal(false);
            onClose();
          }}
          editBooking={booking}
        />
      )}
    </>
  );
};

export default BookingModal;