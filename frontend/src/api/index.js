import client from './client';

// Auth
export const signup = (data) => client.post('/auth/signup', data);
export const login = (data) => client.post('/auth/login', data);
export const getMe = () => client.get('/auth/me');

// Sessions
export const createSession = (data) => client.post('/sessions', data);
export const getSessions = () => client.get('/sessions');
export const getSessionById = (id) => client.get(`/sessions/${id}`);
export const deleteSession = (id) => client.delete(`/sessions/${id}`);

// Exercises
export const getExercises = () => client.get('/exercises');
export const createExercise = (data) => client.post('/exercises', data);