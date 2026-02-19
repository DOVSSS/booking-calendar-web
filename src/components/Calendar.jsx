import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import BookingModal from './BookingModal';
import AddBookingModal from './AddBookingModal';

const Calendar = React.memo(({ isAdmin }) => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'bookings'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate(),
          endDate: doc.data().endDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        }));
        setBookings(bookingsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Преобразуем брони в события для календаря
  const events = useMemo(() => {
    return bookings.flatMap(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const eventsList = [];

      // День заезда (с 14:00 до 24:00)
      const firstDayEnd = new Date(start);
      firstDayEnd.setHours(23, 59, 59, 999);
      eventsList.push({
        id: `${booking.id}-day1`,
        title: '🔸 Заезд',
        start: start,
        end: firstDayEnd,
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        textColor: '#ffffff',
        allDay: false,
        extendedProps: { ...booking, part: 'first' }
      });

      // Полные дни между (если есть)
      const nextDay = new Date(start);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      const lastDay = new Date(end);
      lastDay.setHours(0, 0, 0, 0);

      let current = new Date(nextDay);
      while (current < lastDay) {
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);
        eventsList.push({
          id: `${booking.id}-${current.toISOString()}`,
          title: '🟥 Занято',
          start: new Date(current),
          end: dayEnd,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          textColor: '#ffffff',
          allDay: true,
          extendedProps: { ...booking, part: 'full' }
        });
        current.setDate(current.getDate() + 1);
      }

      // День выезда (00:00 до 11:00)
      if (lastDay < end) {
        eventsList.push({
          id: `${booking.id}-lastday`,
          title: '🔹 Выезд',
          start: new Date(lastDay),
          end: end, // end уже содержит время 11:00
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          textColor: '#ffffff',
          allDay: false,
          extendedProps: { ...booking, part: 'last' }
        });
      }

      return eventsList;
    });
  }, [bookings]);

  const handleDateClick = useCallback((info) => {
    const clickedDate = info.date;

    // Проверяем, попадает ли дата в какую-либо бронь
    const booking = bookings.find(b =>
      clickedDate >= b.startDate && clickedDate < b.endDate
    );

    if (booking) {
      setSelectedBooking(booking);
    } else if (isAdmin) {
      // Новая бронь: заезд в 14:00 выбранного дня, выезд на следующий день в 11:00
      const startDate = new Date(clickedDate);
      startDate.setHours(14, 0, 0, 0);

      const endDate = new Date(clickedDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(11, 0, 0, 0);

      setSelectedDates({ start: startDate, end: endDate });
      setShowAddModal(true);
    }
  }, [bookings, isAdmin]);

  const handleEventClick = useCallback((info) => {
    // Показываем модалку с полной информацией о брони (используем extendedProps)
    setSelectedBooking(info.event.extendedProps);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setSelectedDates(null);
  }, []);

  const handleAddClick = useCallback(() => {
    setSelectedDates(null);
    setShowAddModal(true);
  }, []);

  const isDatePast = useCallback((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }, []);

  const dayCellClassNames = useCallback((arg) => {
    return isDatePast(arg.date) ? ['past-date'] : [];
  }, [isDatePast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Загрузка календаря...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Календарь бронирования</h1>
        {isAdmin && (
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить бронь
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ruLocale}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          dayCellClassNames={dayCellClassNames}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          height="auto"
          firstDay={1}
          eventDisplay="block"
          displayEventTime={false} // скрываем время внутри ячейки (и так понятно)
          allDaySlot={false}
        />
      </div>

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          isAdmin={isAdmin}
          onClose={handleCloseModal}
        />
      )}

      {showAddModal && (
        <AddBookingModal
          isAdmin={isAdmin}
          onClose={handleCloseAddModal}
          initialDates={selectedDates}
        />
      )}
    </div>
  );
});

Calendar.displayName = 'Calendar';
export default Calendar;