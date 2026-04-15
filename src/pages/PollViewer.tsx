import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import AppToast, { AppToastState } from '../components/AppToast';
import PageShell from '../components/PageShell';
import '../styles/main.css';
import '../styles/PollPage.css';
import { finishPoll, getPoll, PollDto, submitSurvey } from '../api/pollsApi';

type Votes = {
  [questionIndex: number]: number;
};

const PollViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<PollDto | null>(null);
  const [votes, setVotes] = useState<Votes>({});
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<AppToastState | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    getPoll(id)
      .then((p) => {
        setPoll(p);
        if (p.has_voted) setSubmitted(true);
      })
      .catch(() => setPoll(null));
  }, [id]);

  if (!poll) {
    return (
      <PageShell>
        <div className="poll-page-card text-center">
          <p className="text-muted mb-4">Опрос не найден.</p>
          <button type="button" className="btn btn-outline-dark" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </PageShell>
    );
  }

  const handleOptionChange = (questionIndex: number, optionIndex: number) => {
    if (submitted || poll.is_finished) return;
    setVotes((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleCancelVoteForQuestion = (questionIndex: number) => {
    if (submitted || poll.is_finished) return;
    setVotes((prev) => {
      const newVotes = { ...prev };
      delete newVotes[questionIndex];
      return newVotes;
    });
  };

  const handleSubmit = () => {
    if (poll.is_finished) return;

    if (poll.questions.some((_, idx) => votes[idx] === undefined)) {
      setToast({ tone: 'error', text: 'Пожалуйста, ответьте на все вопросы.' });
      return;
    }

    submitSurvey(
      poll.id,
      Object.entries(votes).reduce<Record<number, number>>((acc, [k, v]) => {
        acc[Number(k)] = v;
        return acc;
      }, {}),
    )
      .then((updated) => {
        setPoll(updated);
        setSubmitted(true);
        setToast({ tone: 'success', text: 'Спасибо за ваш голос!' });
      })
      .catch(async (e) => {
        if (axios.isAxiosError(e) && e.response?.status === 409) {
          setToast({ tone: 'info', text: 'Вы уже отправляли ответы в этом опросе.' });
          setSubmitted(true);
          const refreshed = await getPoll(poll.id).catch(() => null);
          if (refreshed) setPoll(refreshed);
          return;
        }
        setToast({ tone: 'error', text: 'Не удалось отправить голос.' });
      });
  };

  const handleFinishPoll = () => {
    if (!submitted) {
      setToast({ tone: 'error', text: 'Сначала нужно отправить голос.' });
      return;
    }

    finishPoll(poll.id)
      .then((updated) => {
        setPoll(updated);
        setToast({ tone: 'success', text: 'Опрос завершен.' });
      })
      .catch(() => setToast({ tone: 'error', text: 'Не удалось завершить опрос.' }));
  };

  return (
    <PageShell>
      <div className="poll-page-card">
        <h2 className="mb-2">{poll.title}</h2>
        <p className="text-muted text-center small mb-4">
          Уже проголосовало: <strong className="text-dark">{poll.participant_count}</strong>
        </p>

        {poll.questions.map((q, i) => (
          <div key={i} className="card shadow-sm border-secondary mb-4 survey-question-card">
            <div className="card-body">
              <h5 className="card-title fw-bold text-dark mb-3">
                Вопрос {i + 1}: {q.text}
              </h5>
              {q.options.map((opt, idx) => (
                <div key={idx} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`question_${i}`}
                    id={`q${i}_opt${idx}`}
                    value={idx}
                    disabled={submitted || poll.is_finished}
                    checked={votes[i] === idx}
                    onChange={() => handleOptionChange(i, idx)}
                  />
                  <label className="form-check-label" htmlFor={`q${i}_opt${idx}`}>
                    {opt.text}
                    <span className="text-muted small ms-1">({opt.vote_count})</span>
                  </label>
                </div>
              ))}

              {!poll.is_finished && !submitted && votes[i] !== undefined && (
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm mt-2"
                  onClick={() => handleCancelVoteForQuestion(i)}
                >
                  Отменить выбор
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {!poll.is_finished ? (
            !submitted ? (
              <button type="button" className="btn btn-dark" onClick={handleSubmit}>
                Отправить голос
              </button>
            ) : (
              <button type="button" className="btn btn-outline-dark" onClick={handleFinishPoll}>
                Завершить опрос
              </button>
            )
          ) : (
            <>
              <div className="alert alert-secondary w-100 mb-0 py-2 text-center">Опрос завершён.</div>
              <button type="button" className="btn btn-outline-dark" onClick={() => navigate(-1)}>
                Назад
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-4">
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => navigate('/create-vote')}>
            ← К созданию опросов
          </button>
        </div>
      </div>
      <AppToast toast={toast} onClose={() => setToast(null)} />
    </PageShell>
  );
};

export default PollViewer;
