import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import BookingModal from './BookingModal';
import AddBookingModal from './AddBookingModal';
import ExpensesWidget from './ExpensesWidget';
import TodosWidget from './TodosWidget';

const Calendar = React.memo(() => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyIncome, setMonthlyIncome] = useState({ total: 0, prepayment: 0, finalPayment: 0 });

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
          prepayment: doc.data().prepayment || 0,
          finalPayment: doc.data().finalPayment || 0,
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

  // Расчёт дохода за текущий месяц
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const monthBookings = bookings.filter(booking => {
      const startDate = new Date(booking.startDate);
      return startDate >= monthStart && startDate <= monthEnd;
    });

    const totalPrepayment = monthBookings.reduce((sum, b) => sum + (b.prepayment || 0), 0);
    const totalFinalPayment = monthBookings.reduce((sum, b) => sum + (b.finalPayment || 0), 0);
    
    setMonthlyIncome({
      total: totalPrepayment + totalFinalPayment,
      prepayment: totalPrepayment,
      finalPayment: totalFinalPayment
    });
  }, [bookings, currentMonth]);

  const handleDatesSet = useCallback((arg) => {
    setCurrentMonth(arg.start);
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
        const newStartDate = new Date(clickedDate);
        newStartDate.setHours(14, 0, 0, 0);
        const newEndDate = new Date(clickedDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
        newEndDate.setHours(11, 0, 0, 0);
        setSelectedDates({ start: newStartDate, end: newEndDate });
        setShowAddModal(true);
      } else {
        setSelectedBooking(booking);
      }
    } else {
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

  const isDatePast = useCallback((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }, []);

  const dayCellClassNames = useCallback((arg) => {
    return isDatePast(arg.date) ? ['past-date'] : [];
  }, [isDatePast]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amount);
  };

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
      {/* Блок с месячным доходом */}
      <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-sm font-medium opacity-90">Доход за {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</h2>
            <p className="text-3xl font-bold">{formatMoney(monthlyIncome.total)}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="opacity-80">Предоплаты</div>
              <div className="font-semibold text-lg">{formatMoney(monthlyIncome.prepayment)}</div>
            </div>
            <div>
              <div className="opacity-80">При въезде</div>
              <div className="font-semibold text-lg">{formatMoney(monthlyIncome.finalPayment)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <ExpensesWidget currentMonth={currentMonth} />
        
        <TodosWidget />
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
          datesSet={handleDatesSet}
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: ''
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