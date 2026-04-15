import React from 'react';
import { useNavigate } from 'react-router-dom';
import SiteFooter from './SiteFooter';
import '../styles/main.css';

type PageShellProps = {
  children: React.ReactNode;
};

const PageShell: React.FC<PageShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('user_email');
  const firstLetter = userEmail ? userEmail.charAt(0).toUpperCase() : '';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    navigate('/');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand navbar-light bg-white shadow-sm fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center text-dark" href="/">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1533/1533890.png"
              alt="Логотип"
              width={40}
              height={40}
              className="me-2"
              style={{ filter: 'grayscale(100%) brightness(0)' }}
            />
            <span
              className="nav-link fw-bold p-0"
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              Голосовалка
            </span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#pageShellNav"
            aria-controls="pageShellNav"
            aria-expanded="false"
            aria-label="Меню"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="pageShellNav">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                >
                  Главная
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/about"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/about');
                  }}
                >
                  О платформе
                </a>
              </li>
            </ul>
          </div>

          {userEmail ? (
            <div className="d-flex align-items-center ms-auto" style={{ gap: '0.5rem' }}>
              <div
                title={userEmail}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#212529',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {firstLetter}
              </div>
              <button type="button" className="btn btn-outline-dark btn-sm" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-outline-dark ms-auto" onClick={() => navigate('/login')}>
              Войти
            </button>
          )}
        </div>
      </nav>

      <main className="flex-grow-1 container my-5 fade-in" style={{ paddingTop: '80px' }}>
        {children}
      </main>

      <SiteFooter />
    </div>
  );
};

export default PageShell;
