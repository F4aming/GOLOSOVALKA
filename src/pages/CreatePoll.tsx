import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import '../styles/createPoll.css';
import { createSimplePoll, deletePoll, listPolls, PollDto } from '../api/pollsApi';
import { absoluteAppUrl } from '../config/appBase';

const CreatePoll: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [allowVoteCancellation, setAllowVoteCancellation] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [polls, setPolls] = useState<PollDto[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    listPolls('simple')
      .then(setPolls)
      .catch(() => showError('Не удалось загрузить список голосований'));
  }, []);

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const showError = (message: string) => {
    setError(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const addOption = () => {
    if (options.length >= 10) {
      showError('Максимум 10 вариантов!');
      return;
    }
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      showError('Минимум 2 варианта!');
      return;
    }
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || options.some(opt => !opt.trim())) {
      showError('Пожалуйста, заполните все поля!');
      return;
    }

    try {
      const created = await createSimplePoll({
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        multiple_choice: multipleChoice,
        allow_vote_cancellation: allowVoteCancellation,
      });
      setPolls(prev => [created, ...prev]);
      navigate(`/vote/${created.id}`);
    } catch {
      showError('Не удалось создать голосование');
    }
  };

  const confirmDeletePoll = async () => {
    if (confirmDeleteId) {
      try {
        await deletePoll(confirmDeleteId);
        const updatedPolls = polls.filter(poll => poll.id !== confirmDeleteId);
        setPolls(updatedPolls);
      } catch {
        showError('Не удалось удалить голосование');
      }
      setConfirmDeleteId(null);
    }
  };

  const copyPollLink = (pollId: string) => {
    const url = absoluteAppUrl(`/vote/${pollId}`);
    navigator.clipboard.writeText(url).then(() => {
      showToastMessage('Ссылка скопирована!');
    });
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
                <a className="nav-link" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                  Главная
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1 container my-5 fade-in" style={{ paddingTop: '80px' }}>
        <h2 className="text-center fw-bold text-dark mb-4">Создание голосования</h2>

        <form className="create-poll-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="question">Вопрос:</label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Введите ваш вопрос"
              required
            />
          </div>

          <div className="form-group">
            <label>Тип голосования:</label>
            <div className="create-poll-type-options">
              <label>
                <input
                  type="radio"
                  name="voteType"
                  checked={!multipleChoice}
                  onChange={() => setMultipleChoice(false)}
                />
                Один вариант
              </label>
              <label style={{ marginLeft: '1rem' }}>
                <input
                  type="radio"
                  name="voteType"
                  checked={multipleChoice}
                  onChange={() => setMultipleChoice(true)}
                />
                Несколько вариантов
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Отмена голоса:</label>
            <div className="create-poll-check-row">
              <label className="create-poll-check-label" htmlFor="allowVoteCancellation">
                <input
                  id="allowVoteCancellation"
                  type="checkbox"
                  checked={allowVoteCancellation}
                  onChange={(e) => setAllowVoteCancellation(e.target.checked)}
                />
                <span>
                  Разрешить участникам отменить голос и проголосовать снова
                  <small className="create-poll-check-hint">
                    Пока голосование открыто, участник может снять свой голос и выбрать варианты заново.
                  </small>
                </span>
              </label>
            </div>
          </div>

          {options.map((option, index) => (
            <div className="form-group option-with-remove" key={index}>
              <label htmlFor={`option${index}`}>Вариант {index + 1}:</label>
              <div className="option-row">
                <input
                  id={`option${index}`}
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Введите вариант ${index + 1}`}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="remove-option-button"
                    onClick={() => removeOption(index)}
                  >
                    ✖
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="button-row">
            <button type="button" className="add-option-button" onClick={addOption}>
              Добавить вариант
            </button>
            <button type="submit" className="create-button">Создать голосование</button>
          </div>
        </form>


        {showToast && <div className="toast-error">{error}</div>}
        {toastMessage && <div className="toast-success">{toastMessage}</div>}

        <hr style={{ margin: '2rem 0' }} />

        <div className="poll-list-section">
          <h3>Список созданных голосований</h3>
          {polls.length === 0 ? (
            <p> пока нет.</p>
          ) : (
            <ul className="poll-list">
              {polls.map(poll => (
                <li key={poll.id} className="poll-item">
                  <Link to={`/vote/${poll.id}`} className="poll-link">
                    {poll.title}
                  </Link>
                  <div className="poll-actions">
                    <button
                      className="copy-link-button"
                      onClick={() => copyPollLink(poll.id)}
                    >
                      📋 Скопировать ссылку
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => setConfirmDeleteId(poll.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {confirmDeleteId && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: '#fff',
                color: '#000',
                padding: '2rem',
                borderRadius: '8px',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 0px 2px rgba(0,0,0,0.5)',
              }}
            >
              <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                Вы уверены, что хотите удалить этот опрос?
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <button
                  onClick={confirmDeletePoll}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#d9534f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Да
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Нет
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <SiteFooter />
    </div>
  );
};

export default CreatePoll;
