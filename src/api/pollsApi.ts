import axios from 'axios';
import { getOrCreateGuestId } from '../utils/guestId';

export type PollOption = {
  id: string;
  position: number;
  text: string;
  vote_count: number;
};

export type PollQuestion = {
  id: string;
  position: number;
  text: string;
  options: PollOption[];
};

export type PollDto = {
  id: string;
  kind: 'simple' | 'survey';
  title: string;
  is_multiple_choice: boolean;
  allow_vote_cancellation: boolean;
  is_finished: boolean;
  participant_count: number;
  has_voted: boolean;
  can_manage: boolean;
  created_at: string;
  questions: PollQuestion[];
};

const api = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  const url = config.url ?? '';
  if (url.includes('/public/polls')) {
    config.headers = config.headers ?? {};
    config.headers['X-Guest-Id'] = getOrCreateGuestId();
  }
  return config;
});

export async function listPolls(kind?: 'simple' | 'survey'): Promise<PollDto[]> {
  const response = await api.get<PollDto[]>('/polls', { params: kind ? { kind } : {} });
  return response.data;
}

export async function getPoll(id: string): Promise<PollDto> {
  const response = await api.get<PollDto>(`/polls/${id}`);
  return response.data;
}

/** Публичная карточка опроса — без обязательной авторизации (гость по X-Guest-Id). */
export async function getPublicPoll(id: string): Promise<PollDto> {
  const response = await api.get<PollDto>(`/public/polls/${id}`);
  return response.data;
}

export async function createSimplePoll(payload: {
  question: string;
  options: string[];
  multiple_choice: boolean;
  allow_vote_cancellation?: boolean;
}): Promise<PollDto> {
  const response = await api.post<PollDto>('/polls/simple', payload);
  return response.data;
}

export async function createSurvey(payload: {
  title: string;
  questions: Array<{ question_text: string; options: string[] }>;
}): Promise<PollDto> {
  const response = await api.post<PollDto>('/polls/survey', payload);
  return response.data;
}

export async function voteSimple(id: string, optionIndexes: number[]): Promise<PollDto> {
  const response = await api.post<PollDto>(`/polls/${id}/vote`, { option_indexes: optionIndexes });
  return response.data;
}

export async function voteSimplePublic(id: string, optionIndexes: number[]): Promise<PollDto> {
  const response = await api.post<PollDto>(`/public/polls/${id}/vote`, {
    option_indexes: optionIndexes,
  });
  return response.data;
}

export async function revokeSimpleVote(id: string): Promise<PollDto> {
  const response = await api.post<PollDto>(`/polls/${id}/revoke-vote`);
  return response.data;
}

export async function revokeSimpleVotePublic(id: string): Promise<PollDto> {
  const response = await api.post<PollDto>(`/public/polls/${id}/revoke-vote`);
  return response.data;
}

export async function submitSurvey(id: string, answers: Record<number, number>): Promise<PollDto> {
  const response = await api.post<PollDto>(`/polls/${id}/submit`, { answers });
  return response.data;
}

export async function submitSurveyPublic(id: string, answers: Record<number, number>): Promise<PollDto> {
  const response = await api.post<PollDto>(`/public/polls/${id}/submit`, { answers });
  return response.data;
}

export async function finishPoll(id: string): Promise<PollDto> {
  const response = await api.post<PollDto>(`/polls/${id}/finish`);
  return response.data;
}

export async function deletePoll(id: string): Promise<void> {
  await api.delete(`/polls/${id}`);
}
