// TodosWidget.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const TodosWidget = ({ className }) => {
  const [todos, setTodos] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'todos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setTodos(todosData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!newTodoText.trim()) throw new Error('Введите текст задачи');
      await addDoc(collection(db, 'todos'), {
        text: newTodoText.trim(),
        completed: false,
        createdAt: Timestamp.now()
      });
      setNewTodoText('');
      setShowAddModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      await updateDoc(doc(db, 'todos', todo.id), { completed: !todo.completed });
    } catch (err) {
      console.error('Ошибка при обновлении:', err);
    }
  };

  const handleDeleteTodo = async (id) => {
    if (!window.confirm('Удалить задачу?')) return;
    try {
      await deleteDoc(doc(db, 'todos', id));
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  const completedCount = todos.filter(t => t.completed).length;
  const isMobile = window.innerWidth < 768;

  return (
    <>
      <div className={`relative ${className || ''}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center gap-1.5 bg-purple-500 hover:bg-purple-600 transition-colors text-white px-3 py-1.5 rounded-lg shadow-md text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span>{completedCount}/{todos.length}</span>
          <svg className={`w-3 h-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <>
            {isMobile ? (
              <div className="fixed inset-0 bg-white z-50 flex flex-col">
                <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-lg">Задачи</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowAddModal(true)} className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1">
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
                  {todos.length === 0 ? <p className="text-gray-500 text-center py-8">Нет задач</p> : (
                    <div className="space-y-3">
                      {todos.map(todo => (
                        <div key={todo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleToggleComplete(todo)}>
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${todo.completed ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                              {todo.completed && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-gray-700 ${todo.completed ? 'line-through text-gray-400' : ''}`}>{todo.text}</span>
                          </div>
                          <button onClick={() => handleDeleteTodo(todo.id)} className="text-gray-400 hover:text-red-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute top-full right-0 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border z-50 max-h-[80vh] overflow-hidden">
                <div className="p-3 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-2 sticky top-0 bg-white py-1 z-10">
                    <h3 className="font-semibold text-gray-800 text-sm">Задачи</h3>
                    <button onClick={() => setShowAddModal(true)} className="text-purple-600 hover:text-purple-700 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Добавить
                    </button>
                  </div>
                  {todos.length === 0 ? <p className="text-gray-500 text-xs text-center py-2">Нет задач</p> : (
                    <div className="space-y-1">
                      {todos.map(todo => (
                        <div key={todo.id} className="flex items-center justify-between p-1.5 bg-gray-50 rounded group">
                          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => handleToggleComplete(todo)}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${todo.completed ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                              {todo.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-xs text-gray-700 ${todo.completed ? 'line-through text-gray-400' : ''}`}>{todo.text}</span>
                          </div>
                          <button onClick={() => handleDeleteTodo(todo.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
              <h3 className="text-lg font-semibold text-gray-800">Добавить задачу</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {error && <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">{error}</div>}
            <form onSubmit={handleAddTodo}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Что нужно сделать?</label>
                <input type="text" value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Например, Очистить бассейн" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50">{loading ? 'Добавление...' : 'Добавить'}</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TodosWidget;