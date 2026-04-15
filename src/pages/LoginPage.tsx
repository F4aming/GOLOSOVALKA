import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import '../styles/login.css';
import { loginUser } from '../api/authApi';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const token = await loginUser(normalizedEmail, password);
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_email', normalizedEmail);
      navigate('/');
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      setError('Неверный email или пароль');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1 d-flex flex-column justify-content-center py-4">
        <div className="login-container">
          <h2 className="login-title">Вход</h2>
          <form className="login-form" onSubmit={handleLogin}>
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
            />

            <button type="submit">Войти</button>
          </form>
          {error && <p style={{ color: '#b00020', marginTop: '0.5rem' }}>{error}</p>}

          <div className="register-section">
            <p>Нет аккаунта?</p>
            <button className="register-button" onClick={handleRegister}>
              Зарегистрироваться
            </button>
          </div>

          <div className="back-home-section">
            <button className="back-home-button" onClick={handleBackHome}>
              Назад на главную
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default LoginPage;
