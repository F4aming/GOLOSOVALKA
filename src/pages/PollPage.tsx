import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import AppToast, { AppToastState } from '../components/AppToast';
import PageShell from '../components/PageShell';
import '../styles/main.css';
import '../styles/PollPage.css';
import {
  getPublicPoll,
  PollDto,
  revokeSimpleVotePublic,
  voteSimplePublic,
} from '../api/pollsApi';

function votesRu(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return 'голос';
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return 'голоса';
  return 'голосов';
}

const PollPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<PollDto | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [toast, setToast] = useState<AppToastState | null>(null);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPublicPoll(id)
      .then((p) => {
        setPoll(p);
        setHasVoted(p.has_voted);
      })
      .catch(() => setPoll(null));
  }, [id]);

  const handleSelect = (index: number) => {
    if (poll?.is_finished || hasVoted) return;
    if (!poll?.is_multiple_choice) {
      setSelectedOptions([index]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    }
  };

  const performRevokeVote = async () => {
    if (!poll) return;
    setRevokeModalOpen(false);
    try {
      const updated = await revokeSimpleVotePublic(poll.id);
      setPoll(updated);
      setHasVoted(false);
      setSelectedOptions([]);
      setToast({ tone: 'success', text: 'Голос отменен.' });
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        setToast({ tone: 'error', text: 'В этом голосовании отмена голоса не разрешена.' });
        return;
      }
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        setToast({ tone: 'error', text: 'Нельзя отменить этот голос (старый формат или голосование закрыто).' });
        const refreshed = await getPublicPoll(poll.id).catch(() => null);
        if (refreshed) setPoll(refreshed);
        return;
      }
      setToast({ tone: 'error', text: 'Не удалось отменить голос.' });
    }
  };

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0) return;
    try {
      const updated = await voteSimplePublic(poll.id, selectedOptions);
      setPoll(updated);
      setHasVoted(true);
      setToast({ tone: 'success', text: 'Голос успешно отправлен.' });
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        setToast({ tone: 'info', text: 'Вы уже голосовали в этом голосовании.' });
        setHasVoted(true);
        const refreshed = await getPublicPoll(poll.id).catch(() => null);
        if (refreshed) setPoll(refreshed);
        return;
      }
      setToast({ tone: 'error', text: 'Не удалось отправить голос.' });
    }
  };

  if (!poll) {
    return (
      <PageShell>
        <div className="poll-page-card text-center">
          <p className="text-muted mb-4">Голосование не найдено.</p>
          <Link to="/create" className="btn btn-outline-dark">
            К созданию голосования
          </Link>
        </div>
      </PageShell>
    );
  }

  if (poll.kind !== 'simple' || poll.questions.length === 0) {
    return (
      <PageShell>
        <div className="poll-page-card text-center">
          <p className="text-muted mb-4">Это не голосование этого типа.</p>
          <Link to="/create" className="btn btn-outline-dark">
            Назад
          </Link>
        </div>
      </PageShell>
    );
  }

  const question = poll.questions[0];
  const sumOptionVotes = question.options.reduce((acc, o) => acc + o.vote_count, 0);
  const percentBase =
    poll.participant_count > 0 ? poll.participant_count : sumOptionVotes;
  const canVote = !hasVoted && !poll.is_finished;
  const canRevoke =
    poll.allow_vote_cancellation && hasVoted && !poll.is_finished;
  const hasAnyVotes = sumOptionVotes > 0 || poll.participant_count > 0;

  return (
    <PageShell>
      <div className="poll-page-card">
        <h2>{poll.title}</h2>
        <p className="text-muted text-center small mb-4">
          Уже проголосовало: <strong className="text-dark">{poll.participant_count}</strong>
          {!hasAnyVotes && (
            <span> — статистика у вариантов появится после первых голосов.</span>
          )}
        </p>

        <ul className="option-list option-list--with-stats">
          {question.options.map((option, index) => {
            const voteCount = option.vote_count;
            const percent =
              percentBase > 0 ? (voteCount / percentBase) * 100 : 0;
            const pctLabel = percent.toFixed(1).replace(/\.0$/, '');

            return (
              <li key={index} className="option-with-stats">
                <div className="option-row-line">
                  {canVote ? (
                    <label className="option-label-inline">
                      <input
                        type={poll.is_multiple_choice ? 'checkbox' : 'radio'}
                        name="option"
                        value={index}
                        checked={selectedOptions.includes(index)}
                        onChange={() => handleSelect(index)}
                      />
                      <span className="option-text">{option.text}</span>
                    </label>
                  ) : (
                    <span className="option-text option-text--readonly">{option.text}</span>
                  )}
                  <span className="option-stats" title="Голосов и доля от числа участников">
                    {voteCount} {votesRu(voteCount)} ·{' '}
                    <strong>{pctLabel}%</strong>
                  </span>
                </div>
                <div className="result-bar-container option-inline-bar">
                  <div
                    className="result-bar"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  >
                    {pctLabel}%
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {canVote && (
          <button
            type="button"
            onClick={handleVote}
            className="btn btn-dark w-100 mt-4"
            disabled={selectedOptions.length === 0}
          >
            Проголосовать
          </button>
        )}

        {canRevoke && (
          <button
            type="button"
            onClick={() => setRevokeModalOpen(true)}
            className="btn btn-outline-danger w-100 mt-3"
          >
            Отменить мой голос
          </button>
        )}

        {revokeModalOpen && (
          <div
            className="poll-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="poll-revoke-title"
          >
            <div className="poll-modal-content">
              <p id="poll-revoke-title" className="poll-modal-title">
                Отменить ваш голос?
              </p>
              <p className="poll-modal-text text-muted small mb-0">
                Счётчики по вариантам и число участников уменьшатся. Вы сможете проголосовать снова.
              </p>
              <div className="poll-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => setRevokeModalOpen(false)}
                >
                  Нет
                </button>
                <button type="button" className="btn btn-danger" onClick={performRevokeVote}>
                  Да, отменить
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="back-wrapper">
          <Link to="/create" className="btn btn-outline-dark btn-sm">
            ← Назад к созданию голосования
          </Link>
        </div>
      </div>
      <AppToast toast={toast} onClose={() => setToast(null)} />
    </PageShell>
  );
};

export default PollPage;
