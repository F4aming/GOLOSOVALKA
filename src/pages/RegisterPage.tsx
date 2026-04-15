import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import '../styles/login.css';
import { registerUser } from '../api/authApi';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      const token = await registerUser(normalizedEmail, password);
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_email', normalizedEmail);
      navigate('/');
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      setError('Пользователь с таким email уже существует');
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1 d-flex flex-column justify-content-center py-4">
        <div className="login-container">
          <h2 className="login-title">Регистрация</h2>
          <form className="login-form" onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <input
              type="password"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />

            <button type="submit">Зарегистрироваться</button>
          </form>
          {error && <p style={{ color: '#b00020', marginTop: '0.5rem' }}>{error}</p>}

          <div className="register-section">
            <p>Уже есть аккаунт?</p>
            <button className="register-button" onClick={() => navigate('/login')}>
              Войти
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default RegisterPage;
