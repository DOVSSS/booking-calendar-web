import { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { checkIsAdmin } from './firebase/auth';
import Calendar from './components/Calendar';
import AdminPanel from './components/AdminPanel';
import './index.css';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase автоматически восстанавливает сессию из localStorage
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("Session restored for:", user.email);
        const admin = await checkIsAdmin(user);
        setIsAdmin(admin);
        setUser(user);
      } else {
        console.log("No active session");
        setIsAdmin(false);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPanel 
        isAdmin={isAdmin} 
        setIsAdmin={setIsAdmin}
        user={user}
        setUser={setUser}
      />
      
      <main className="container mx-auto py-6">
        <Calendar isAdmin={isAdmin} />
      </main>
      
      <footer className="text-center py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} Календарь бронирования домика
      </footer>
    </div>
  );
}

export default App;