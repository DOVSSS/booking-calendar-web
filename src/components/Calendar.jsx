import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import BookingModal from './BookingModal';
import AddBookingModal from './AddBookingModal';

const Calendar = React.memo(() => {
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

  const events = useMemo(() => {
    return bookings.flatMap(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const eventsList = [];

      let current = new Date(start);
      current.setHours(0, 0, 0, 0);
      const last = new Date(end);
      last.setHours(0, 0, 0, 0);

      while (current < last) {
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);
        eventsList.push({
          id: `${booking.id}-${current.toISOString()}`,
          title: 'Занято',
          start: new Date(current),
          end: dayEnd,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          textColor: '#ffffff',
          allDay: true,
          extendedProps: booking
        });
        current.setDate(current.getDate() + 1);
      }

      return eventsList;
    });
  }, [bookings]);

  const handleDateClick = useCallback((info) => {
    const clickedDate = info.date;

    const booking = bookings.find(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      
      const startDay = new Date(start);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);
      const clickedDay = new Date(clickedDate);
      clickedDay.setHours(0, 0, 0, 0);
      
      return clickedDay >= startDay && clickedDay < endDay;
    });

    if (booking) {
      const endDay = new Date(booking.endDate);
      endDay.setHours(0, 0, 0, 0);
      const clickedDay = new Date(clickedDate);
      clickedDay.setHours(0, 0, 0, 0);

      if (clickedDay.getTime() === endDay.getTime()) {
        // День выезда — форма для новой брони
        const newStartDate = new Date(clickedDate);
        newStartDate.setHours(14, 0, 0, 0);
        const newEndDate = new Date(clickedDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
        newEndDate.setHours(11, 0, 0, 0);
        setSelectedDates({ start: newStartDate, end: newEndDate });
        setShowAddModal(true);
      } else {
        // День заезда или промежуточный — данные клиента
        setSelectedBooking(booking);
      }
    } else {
      // Свободный день — форма для новой брони
      const startDate = new Date(clickedDate);
      startDate.setHours(14, 0, 0, 0);
      const endDate = new Date(clickedDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(11, 0, 0, 0);
      setSelectedDates({ start: startDate, end: endDate });
      setShowAddModal(true);
    }
  }, [bookings]);

  const handleEventClick = useCallback((info) => {
    handleDateClick({ date: info.event.start });
  }, [handleDateClick]);

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
        <button
          onClick={handleAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить бронь
        </button>
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
          displayEventTime={false}
        />
      </div>

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={handleCloseModal}
        />
      )}

      {showAddModal && (
        <AddBookingModal
          onClose={handleCloseAddModal}
          initialDates={selectedDates}
        />
      )}
    </div>
  );
});

Calendar.displayName = 'Calendar';
export default Calendar;