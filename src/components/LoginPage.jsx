import React, { useState } from 'react';
import { login } from '../firebase/auth';
import BrandLogo from './BrandLogo';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-brand-charcoal rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-white/10"
      >
        <div className="flex justify-center mb-2">
          <BrandLogo size="lg" showText={false} />
        </div>
        <h1 className="text-xl font-semibold text-brand-silver text-center">Вход</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="username"
          required
          className="bg-brand-slate border border-white/10 text-white placeholder:text-brand-muted rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-silver"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoComplete="current-password"
          required
          className="bg-brand-slate border border-white/10 text-white placeholder:text-brand-muted rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-silver"
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-brand-silver hover:bg-white disabled:opacity-60 text-brand-dark font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
