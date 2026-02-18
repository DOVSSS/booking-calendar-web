import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import BookingModal from './BookingModal';
import AddBookingModal from './AddBookingModal';

const Calendar = ({ isAdmin }) => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setConnectionError(false);
    
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
        setConnectionError(false);
      },
      (error) => {
        console.error("Firestore connection error:", error);
        setConnectionError(true);
        setLoading(false);
        
        // Пытаемся переподключиться через 5 секунд
        setTimeout(() => {
          setConnectionError(false);
        }, 5000);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Загрузка календаря...</div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">Ошибка подключения к серверу</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  const events = bookings.map(booking => ({
    id: booking.id,
    title: 'Занято',
    start: booking.startDate,
    end: booking.endDate,
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
    extendedProps: booking,
  }));

  const handleDateClick = (info) => {
    const clickedDate = info.date;
    const booking = bookings.find(b => 
      clickedDate >= b.startDate && clickedDate < b.endDate
    );
    
    if (booking) {
      setSelectedBooking(booking);
    } else if (isAdmin) {
      const endDate = new Date(clickedDate);
      endDate.setDate(endDate.getDate() + 1);
      setSelectedDates({
        start: clickedDate,
        end: endDate
      });
      setShowAddModal(true);
    }
  };

  const handleEventClick = (info) => {
    setSelectedBooking(info.event.extendedProps);
  };

  const isDatePast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const dayCellClassNames = (arg) => {
    const classes = [];
    if (isDatePast(arg.date)) {
      classes.push('past-date');
    }
    return classes;
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Календарь бронирования</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedDates(null);
              setShowAddModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить бронь
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-3">
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
        />
      </div>

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          isAdmin={isAdmin}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {showAddModal && (
        <AddBookingModal
          isAdmin={isAdmin}
          onClose={() => {
            setShowAddModal(false);
            setSelectedDates(null);
          }}
          initialDates={selectedDates}
        />
      )}
    </div>
  );
};

export default Calendar;