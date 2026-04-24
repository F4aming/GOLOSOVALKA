import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppToast, { AppToastState } from '../components/AppToast';
import SiteFooter from '../components/SiteFooter';
import '../styles//PollCreator.css';
import { createSurvey, deletePoll, listPolls, PollDto } from '../api/pollsApi';
import { absoluteAppUrl } from '../config/appBase';

type Question = {
  questionText: string;
  options: string[];
  multipleChoice: boolean;
};

const PollCreator: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([
        { questionText: '', options: ['', ''], multipleChoice: false }
    ]);
    const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
    const [polls, setPolls] = useState<PollDto[]>([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [toast, setToast] = useState<AppToastState | null>(null);
    const navigate = useNavigate();

  useEffect(() => {
    listPolls('survey').then(setPolls).catch(() => setPolls([]));

    setVisible(true);

  }, []);

  // Добавить вопрос
  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', ''], multipleChoice: false }]);
  };

  // Удаление вопроса (подтверждение)
  const deleteQuestion = (index: number) => {
    setConfirmDeleteIndex(index);
  };

  const confirmDeleteQuestion = () => {
    if (confirmDeleteIndex !== null) {
      const updated = [...questions];
      updated.splice(confirmDeleteIndex, 1);
      setQuestions(updated);
      setConfirmDeleteIndex(null);
    }
  };

  // Обновить текст вопроса
  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].questionText = text;
    setQuestions(updated);
  };

  // Обновить вариант ответа
  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = text;
    setQuestions(updated);
  };

  const updateQuestionMultipleChoice = (qIndex: number, multipleChoice: boolean) => {
    const updated = [...questions];
    updated[qIndex].multipleChoice = multipleChoice;
    setQuestions(updated);
  };

  // Добавить вариант
  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  // Удалить вариант
  const deleteOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length > 2) {
      updated[qIndex].options.splice(oIndex, 1);
      setQuestions(updated);
    }
  };

  // Создание нового опроса и сохранение в localStorage
  const handleSubmit = async () => {
    if (!title.trim()) {
      setToast({ tone: 'error', text: 'Пожалуйста, введите название опроса.' });
      return;
    }
    if (questions.some(q => !q.questionText.trim() || q.options.some(opt => !opt.trim()))) {
      setToast({ tone: 'error', text: 'Пожалуйста, заполните все вопросы и варианты.' });
      return;
    }

    try {
      const created = await createSurvey({
        title: title.trim(),
        questions: questions.map(q => ({
          question_text: q.questionText.trim(),
          options: q.options.map(opt => opt.trim()),
          multiple_choice: q.multipleChoice,
        })),
      });
      setPolls(prev => [created, ...prev]);
      setTitle('');
      setQuestions([{ questionText: '', options: ['', ''], multipleChoice: false }]);
      navigate(`/poll/${created.id}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_email');
        setToast({ tone: 'error', text: 'Сессия истекла. Войдите снова.' });
        navigate('/login');
        return;
      }
      setToast({ tone: 'error', text: 'Не удалось создать опрос.' });
    }
  };

  // Подтверждение удаления опроса
  const confirmDeletePoll = async () => {
    if (confirmDeleteId) {
      try {
        await deletePoll(confirmDeleteId);
        const updatedPolls = polls.filter(poll => poll.id !== confirmDeleteId);
        setPolls(updatedPolls);
      } catch {
        setToast({ tone: 'error', text: 'Не удалось удалить опрос.' });
      }
      setConfirmDeleteId(null);
    }
  };

  // Копирование ссылки на опрос
  const copyPollLink = (pollId: string) => {
    const url = absoluteAppUrl(`/poll/${pollId}`);
    navigator.clipboard.writeText(url).then(() => {
      setToast({ tone: 'success', text: 'Ссылка скопирована!' });
    });
  };

  return (
   <div className={`d-flex flex-column min-vh-100 page-fade ${visible ? 'visible' : ''}`} style={{ overflowY: 'auto' }}>
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

          {/* Кнопка для мобильных устройств, чтобы раскрыть меню */}
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

          {/* Навигационное меню */}
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

      <main className="container my-5 flex-grow-1" style={{ paddingTop: '80px' }}>
        <h1 className="mb-4">Создание опроса</h1>
        <input
          className="form-control mb-4"
          type="text"
          placeholder="Название опроса"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="mb-4 p-3 border rounded position-relative">
            <input
              className="form-control mb-2"
              type="text"
              placeholder={`Вопрос ${qIdx + 1}`}
              value={q.questionText}
              onChange={e => updateQuestionText(qIdx, e.target.value)}
            />
            <div className="mb-2">
              <label className="form-label mb-1 d-block">Тип ответа:</label>
              <div className="d-flex gap-3">
                <label>
                  <input
                    type="radio"
                    name={`questionType_${qIdx}`}
                    checked={!q.multipleChoice}
                    onChange={() => updateQuestionMultipleChoice(qIdx, false)}
                  />{' '}
                  Один вариант
                </label>
                <label>
                  <input
                    type="radio"
                    name={`questionType_${qIdx}`}
                    checked={q.multipleChoice}
                    onChange={() => updateQuestionMultipleChoice(qIdx, true)}
                  />{' '}
                  Несколько вариантов
                </label>
              </div>
            </div>

            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className="input-group mb-2">
                <input
                  className="form-control"
                  type="text"
                  placeholder={`Вариант ${oIdx + 1}`}
                  value={opt}
                  onChange={e => updateOptionText(qIdx, oIdx, e.target.value)}
                />
                {q.options.length > 2 && (
                  <button
                    className="btn btn-outline-danger"
                    type="button"
                    onClick={() => deleteOption(qIdx, oIdx)}
                    title="Удалить вариант"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}

            <div className="d-flex justify-content-between">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => addOption(qIdx)}
              >
                + Добавить вариант
              </button>
              <button
                type="button"
                className="remove-option-button"
                onClick={() => deleteQuestion(qIdx)}
              >
                ✖
              </button>
            </div>
          </div>
        ))}

        <div className="d-flex gap-2 mb-5">
          <button className="btn btn-outline-dark" onClick={addQuestion}>
            + Добавить вопрос
          </button>
          <button className="btn btn-dark" onClick={handleSubmit}>
            Сохранить опрос
          </button>
        </div>

        {/* Модальное окно подтверждения удаления вопроса */}
        {confirmDeleteIndex !== null && (
          <div className="modal-overlay">
            <div className="modal-content">
              <p className="modal-text">Удалить этот вопрос?</p>
              <div className="modal-buttons">
                <button className="btn btn-danger" onClick={confirmDeleteQuestion}>
                  Да
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmDeleteIndex(null)}>
                  Нет
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Список созданных опросов */}
        <div className="poll-list-section mt-5">
          <h3>Список созданных опросов</h3>
          {polls.length === 0 ? (
            <p>Опросов пока нет.</p>
          ) : (
            <ul className="poll-list list-group">
              {polls.map(poll => (
                <li key={poll.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/poll/${poll.id}`)}
                    title="Перейти к опросу"
                  >
                    {poll.title}
                  </span>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      className="btn btn-outline-danger"
                      title="Удалить опрос"
                      onClick={() => setConfirmDeleteId(poll.id)}
                    >
                      🗑
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      title="Скопировать ссылку"
                      onClick={() => copyPollLink(poll.id)}
                    >
                      📋
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Модальное окно подтверждения удаления опроса */}
        {confirmDeleteId && (
          <div className="modal-overlay">
            <div className="modal-content">
              <p className="modal-text">Удалить опрос?</p>
              <div className="modal-buttons">
                <button className="btn btn-danger" onClick={confirmDeletePoll}>
                  Да
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                  Нет
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <AppToast toast={toast} onClose={() => setToast(null)} />
      <SiteFooter />
    </div>
  );
};

export default PollCreator;
