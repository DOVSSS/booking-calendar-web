import React, { useState, useCallback } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AddBookingModal from './AddBookingModal';
import BrandLogo from './BrandLogo';

const BookingModal = React.memo(({ booking, onClose, houseName, houseId }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 z-50">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Карточка для скрина клиенту */}
          <div className="bg-brand-charcoal rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center border-b border-white/10">
              <BrandLogo size="md" className="flex-col items-center" />
              <p className="text-[11px] tracking-[0.28em] uppercase text-brand-muted mt-4">
                Подтверждение брони
              </p>
              {houseName && (
                <p className="text-brand-silver text-sm mt-1">{houseName}</p>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-[10px] tracking-[0.22em] uppercase text-brand-muted">Гость</p>
                <p className="text-brand-silver text-lg font-medium mt-1">{booking.name}</p>
                {booking.phone && (
                  <p className="text-brand-muted text-sm mt-0.5">{booking.phone}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4">
                <div>
                  <p className="text-[10px] tracking-[0.22em] uppercase text-brand-muted">Заезд</p>
                  <p className="text-brand-silver font-medium mt-1">{formatDate(booking.startDate)}</p>
                  <p className="text-brand-muted text-xs mt-1">после 14:00</p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <p className="text-[10px] tracking-[0.22em] uppercase text-brand-muted">Выезд</p>
                  <p className="text-brand-silver font-medium mt-1">{formatDate(booking.endDate)}</p>
                  <p className="text-brand-muted text-xs mt-1">до 11:00</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.22em] uppercase text-brand-muted">Оплата</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Предоплата</span>
                    <span className="text-brand-silver">{formatMoney(booking.prepayment || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Доплата при въезде</span>
                    <span className="text-brand-silver">{formatMoney(booking.finalPayment || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/10">
                    <span className="text-sm text-brand-muted">Итого</span>
                    <span className="text-lg font-semibold text-white">{formatMoney(totalPayment)}</span>
                  </div>
                </div>
              </div>

              {booking.comment && (
                <div>
                  <p className="text-[10px] tracking-[0.22em] uppercase text-brand-muted">Комментарий</p>
                  <p className="text-brand-silver text-sm mt-1 whitespace-pre-wrap break-words">{booking.comment}</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 pt-2 text-center">
              <p className="text-[10px] tracking-[0.2em] uppercase text-brand-muted">Ждём вас в RESIDENCE</p>
            </div>
          </div>

          {/* Служебные кнопки — не входят в карточку для клиента */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEdit}
              disabled={deleting}
              className="flex-1 bg-brand-slate hover:bg-white/10 text-brand-silver font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-brand-slate hover:bg-red-900/60 text-brand-silver hover:text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {deleting ? 'Удаление...' : 'Удалить'}
            </button>
            <button
              onClick={onClose}
              className="bg-brand-slate hover:bg-white/10 text-brand-silver py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Закрыть
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
          houseId={houseId || booking.houseId}
        />
      )}
    </>
  );
});

BookingModal.displayName = 'BookingModal';
export default BookingModal;
