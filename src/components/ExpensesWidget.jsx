import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const ExpensesWidget = ({ currentMonth }) => {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // для раскрытия виджета

  // Загрузка расходов за текущий месяц
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const q = query(collection(db, 'expenses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        }))
        .filter(exp => exp.year === year && exp.month === month);
      
      setExpenses(expensesData);
    });

    return () => unsubscribe();
  }, [currentMonth]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amount);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amount = parseInt(newExpenseAmount.replace(/[^\d]/g, ''), 10);
      if (!newExpenseName.trim()) {
        throw new Error('Введите название расхода');
      }
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Введите корректную сумму');
      }

      await addDoc(collection(db, 'expenses'), {
        name: newExpenseName.trim(),
        amount: amount,
        date: Timestamp.fromDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)),
        month: currentMonth.getMonth(),
        year: currentMonth.getFullYear(),
        createdAt: Timestamp.now()
      });

      setNewExpenseName('');
      setNewExpenseAmount('');
      setShowAddModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Удалить расход?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  return (
    <div className="relative">
      {/* Кнопка-индикатор расходов */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white px-4 py-2 rounded-lg shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v4" />
        </svg>
        <span>Расходы: {formatMoney(totalExpenses)}</span>
        <svg className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Выпадающая панель с расходами */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Расходы за месяц</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить
              </button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Нет расходов</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {expenses.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{exp.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-600">{formatMoney(exp.amount)}</span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <span className="font-medium text-gray-800">Итого расходов:</span>
              <span className="font-bold text-red-600">{formatMoney(totalExpenses)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Модалка добавления расхода */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Добавить расход</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleAddExpense}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Например, Коммунальные услуги"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="1000"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Добавление...' : 'Добавить'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesWidget;