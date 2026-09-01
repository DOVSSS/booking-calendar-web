import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const ExpensesWidget = ({ year, month, className }) => {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(year);
  const [currentMonth, setCurrentMonth] = useState(month);

  useEffect(() => {
    setCurrentYear(year);
    setCurrentMonth(month);
  }, [year, month]);

  useEffect(() => {
    if (currentYear === undefined || currentMonth === undefined) return;
    
    const q = query(collection(db, 'expenses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allExpenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      
      // Фильтруем по году и месяцу
      const filteredExpenses = allExpenses.filter(exp => 
        exp.year === currentYear && exp.month === currentMonth
      );
      
      // Сортируем по дате создания: новые сверху (по убыванию)
      const sortedExpenses = filteredExpenses.sort((a, b) => 
        (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
      
      setExpenses(sortedExpenses);
    });

    return () => unsubscribe();
  }, [currentYear, currentMonth]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const amount = parseInt(newExpenseAmount.replace(/[^\d]/g, ''), 10);
      if (!newExpenseName.trim()) throw new Error('Введите название расхода');
      if (isNaN(amount) || amount <= 0) throw new Error('Введите корректную сумму');
      
      const now = Timestamp.now();
      await addDoc(collection(db, 'expenses'), {
        name: newExpenseName.trim(),
        amount,
        date: now,             // текущая дата
        month: currentMonth,
        year: currentYear,
        createdAt: now         // тоже текущая дата
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

  const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const isMobile = window.innerWidth < 768;

  return (
    <>
      <div className={`relative ${className || ''}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 transition-colors text-white px-3 py-1.5 rounded-lg shadow-md text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v4" />
          </svg>
          <span>{formatMoney(totalExpenses)}</span>
          <svg className={`w-3 h-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            {isMobile ? (
              <div className="fixed inset-0 bg-white z-50 flex flex-col">
                <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-lg">Расходы за {monthNames[currentMonth]} {currentYear}</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowAddModal(true)} className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Добавить
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {expenses.length === 0 ? <p className="text-gray-500 text-center py-8">Нет расходов</p> : (
                    <div className="space-y-3">
                      {expenses.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                          <div className="flex-1">
                            <span className="text-gray-700">{exp.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{formatDate(exp.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-red-600">{formatMoney(exp.amount)}</span>
                            <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-400 hover:text-red-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Итого:</span>
                        <span className="font-bold text-red-600 text-lg">{formatMoney(totalExpenses)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute top-full left-0 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border z-50 max-h-[80vh] overflow-hidden">
                <div className="p-3 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-2 sticky top-0 bg-white py-1 z-10">
                    <h3 className="font-semibold text-gray-800 text-sm">Расходы за {monthNames[currentMonth]} {currentYear}</h3>
                    <button onClick={() => setShowAddModal(true)} className="text-orange-600 hover:text-orange-700 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Добавить
                    </button>
                  </div>
                  {expenses.length === 0 ? <p className="text-gray-500 text-xs text-center py-2">Нет расходов</p> : (
                    <div className="space-y-1">
                      {expenses.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center p-1.5 bg-gray-50 rounded text-sm">
                          <div className="flex flex-col flex-1 mr-2">
                            <span className="text-gray-700 text-xs break-words">{exp.name}</span>
                            <span className="text-[10px] text-gray-400">{formatDate(exp.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs font-medium text-red-600">{formatMoney(exp.amount)}</span>
                            <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-400 hover:text-red-500">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-800">Итого:</span>
                    <span className="font-bold text-red-600">{formatMoney(totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Добавить расход</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">{error}</div>}
            <form onSubmit={handleAddExpense}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input type="text" value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Например, Коммунальные услуги" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽)</label>
                <input type="text" inputMode="numeric" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value.replace(/[^\d]/g, ''))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="1000" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50">{loading ? 'Добавление...' : 'Добавить'}</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpensesWidget;