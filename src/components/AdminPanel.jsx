import { useState, useEffect } from 'react';
import { loginAdmin, logoutAdmin } from '../firebase/auth';

const AdminPanel = ({ isAdmin, setIsAdmin, user, setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Загружаем сохраненный email из localStorage при монтировании
  useEffect(() => {
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { user, error } = await loginAdmin(email, password);
    
    if (error) {
      setError('Ошибка входа: ' + error);
    } else {
      // Сохраняем email в localStorage
      localStorage.setItem('adminEmail', email);
      
      setUser(user);
      setIsAdmin(true);
      setShowLoginForm(false);
      setPassword(''); // очищаем пароль из безопасности
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await logoutAdmin();
    if (error) {
      alert('Ошибка при выходе: ' + error);
    } else {
      setUser(null);
      setIsAdmin(false);
      // Очищаем пароль, но email оставляем
      setPassword('');
    }
  };

  const handleClearSavedEmail = () => {
    localStorage.removeItem('adminEmail');
    setEmail('');
  };

  if (isAdmin && user) {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">Администратор: {user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        {!showLoginForm ? (
          <button
            onClick={() => setShowLoginForm(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Вход для администратора</span>
          </button>
        ) : (
          <div className="max-w-md mx-auto">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Вход администратора</h3>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="p-2 bg-red-100 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={handleClearSavedEmail}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Очистить сохраненный email"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Вход...' : 'Войти'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;