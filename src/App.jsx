import React from 'react';
import Calendar from './components/Calendar';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-6">
        <Calendar />
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} Календарь бронирования домика
      </footer>
    </div>
  );
}

export default App;