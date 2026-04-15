import React from 'react';
import { useNavigate } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import '../styles/main.css';

const HomePage: React.FC = () => {
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
            <a className="nav-link fw-bold" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                Голосовалка
            </a>
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>
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
              <button className="btn btn-outline-dark btn-sm" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          ) : (
            <button
              className="btn btn-outline-dark ms-auto"
              onClick={() => navigate('/login')}
            >
              Войти
            </button>
          )}
        </div>
      </nav>

      <main className="flex-grow-1 container my-5 fade-in" style={{ paddingTop: '0px' }}>
        <header className="text-center py-5 border-bottom border-secondary">
          <h1 className="display-4 fw-bold text-dark" style={{ paddingBottom: '1.5rem' }}>Платформа для голосований</h1>

          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button
              className="btn btn-dark btn-lg rounded-pill px-4"
              onClick={() => navigate('/create')}
            >
              Создать голосование
            </button>
            <button
              className="btn btn-dark btn-lg rounded-pill px-4"
              onClick={() => navigate('/create-vote')}
            >
              Создать опрос
            </button>
          </div>
        </header>

        <section className="my-5">
          <h2 className="text-center fw-bold text-dark mb-4">Почему выбирают нас</h2>
          <div
            className="mx-auto"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '1.2rem',
            }}
          >
            {[ 
              { title: 'Просто', text: 'Интуитивно понятный интерфейс для всех пользователей.' },
              { title: 'Быстро', text: 'Создание опроса за минуту, результат — сразу.' },
              { title: 'Надёжно', text: 'К чему душа лежит, к тому и руки приложатся.' },
            ].map(({ title, text }, idx) => (
              <div
                key={title}
                className="card shadow-sm border-1 border-secondary"
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#fff',
                  gridColumn: idx % 3 === 0 ? 'span 2' : 'auto',
                  textAlign: 'center',
                  color: '#222',
                  borderRadius: '0.375rem',
                }}
              >
                <h3 className="fw-bold mb-3">{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-5">
          <h2 className="text-center fw-bold text-dark mb-4">Как это работает</h2>
          <div
            className="mx-auto"
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 2fr',
              gap: '1.2rem',
            }}
          >
             {[
                { title: 'Создайте опрос', text: 'Простая форма для создания вопросов и вариантов ответов.'},
                { title: 'Cсылочка', text: 'Отправьте ссылку участникам, чтобы они могли голосовать.'},
                { title: 'Резалт', text: 'Просматривайте результаты голосования1.'},
              ].map(({ title, text}, idx) => (
              <div
                key={title}
                className="card shadow-sm border-1 border-secondary"
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#fff',
                  gridColumn: idx % 3 === 0 ? 'span 2' : 'auto',
                  textAlign: 'center',
                  color: '#222',
                  borderRadius: '0.375rem',
                }}
              >
                <h3 className="fw-bold mb-3">{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-5">
          <h2 className="text-center fw-bold text-dark mb-4">Отзывы пользователей</h2>
          <div
            className="mx-auto"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[{
                name: 'Алексей Р.',
                text: 'Пока што маловато функций(((',
              },
              {
                name: 'Павел Б.',
                text: 'Очень удобная платформа, быстро разобрался и создал опрос',
              },
              {
                name: 'Василий М.',
                text: 'Простота – именно то, что я искал для своих опросов',
              },
            ].map(({ name, text }, idx) => (
              <div
                key={idx}
                className="shadow-sm border-1 border-secondary"
                style={{
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '150px',
                }}
              >
                <p className="fst-italic text-secondary">"{text}"</p>
                <footer className="blockquote-footer mt-3 text-dark">{name}</footer>
              </div>
            ))}
          </div>
        </section>

        <section className="my-5 text-center">
          <h2 className="fw-bold text-dark mb-3">Популярные категории</h2>
          <div className="d-flex flex-wrap justify-content-center">
            {[
              'Образование',
              'Политика',
              'Развлечения',
              'Работа',
              'Спорт',
            ].map((cat, idx) => (
              <div
                key={idx}
                className="badge bg-dark text-white mx-1 my-2 p-3"
                style={{ opacity: 0.9, fontSize: '1rem' }}
              >
                {cat}
              </div>
            ))}
          </div>
        </section>

        <div
          className="text-white text-center py-5"
          style={{
            background: 'linear-gradient(90deg,rgb(255, 255, 255),rgb(0, 0, 0))',
            borderRadius: '0.5rem',
            margin: '2rem 0',
          }}
        >
          <h2 className="fw-bold mb-3">Присоединяйтесь к тысячам пользователей</h2>
          <p className="lead mb-0">Создавайте опросы, делитесь результатами и принимайте решения вместе!!!</p>
        </div>

        <section className="my-5">
          <h2 className="text-center fw-bold text-dark mb-4">Последние новости</h2>
          <div className="row g-4">
            {[{
                title: 'Новый функционал для создания опросов',
                date: '12 мая 2025',
                excerpt: 'Добавлены новые типы вопросов и улучшен интерфейс.',
              },
              {
                title: 'Добавление кнопочки о платформе',
                date: '22 мая 2025',
                excerpt: 'Можно послушать музычку.',
              },
              {
                title: 'Советы по созданию эффективных опросов',
                date: '20 апреля 2025',
                excerpt: 'Прочитайте лучшие практики для создания опросов, которые дадут качественные результаты.',
              },
            ].map(({ title, date, excerpt }, idx) => (
              <div key={idx} className="col-md-4">
                <div className="card h-100 shadow-sm border-1 border-secondary">
                  <div className="card-body">
                    <h5 className="card-title text-dark">{title}</h5>
                    <small className="text-muted">{date}</small>
                    <p className="card-text mt-2 text-secondary">{excerpt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="my-5 text-center">
          <h2 className="fw-bold text-dark mb-3">Подпишитесь на новости</h2>
          <form className="d-flex justify-content-center" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              className="form-control w-50 me-2"
              placeholder="Введите ваш email"
              required
              style={{ borderColor: '#444' }}
            />
            <button type="submit" className="btn btn-dark">Подписаться</button>
          </form>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HomePage;
