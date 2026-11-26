import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import NewSession from '../pages/NewSession';
import { createSession, getLastSets, getSessionById } from '../api';

vi.mock('../api', () => ({
  getExercises: vi.fn(async () => ({ data: { data: { exercises: [
    { _id: 'bench', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
  ] } } })),
  getLastSets: vi.fn(async () => ({ data: { data: { lastSets: { bench: [{ weight: 100, reps: 5 }] } } } })),
  createExercise: vi.fn(),
  getSessionById: vi.fn(),
  createSession: vi.fn(async () => ({ data: { data: { session: { _id: 'saved' } } } })),
}));

it('prefills the previous bench press, adjusts it, and saves it', async () => {
  render(
    <MemoryRouter initialEntries={['/new-session']}>
      <Routes>
        <Route path="/new-session" element={<NewSession />} />
        <Route path="/session/:id" element={<h1>Workout saved</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: /add exercise/i }));
  fireEvent.click(await screen.findByRole('button', { name: /bench press/i }));

  const weight = screen.getByRole('spinbutton', { name: 'Bench Press set 1 weight' });
  const reps = screen.getByRole('spinbutton', { name: 'Bench Press set 1 reps' });
  expect(weight).toHaveValue(100);
  expect(reps).toHaveValue(5);
  fireEvent.click(screen.getByRole('button', { name: 'Decrease Bench Press set 1 weight' }));
  expect(weight).toHaveValue(99);
  fireEvent.click(screen.getByRole('button', { name: 'Save workout' }));

  await waitFor(() => expect(createSession).toHaveBeenCalledWith({
    name: 'Workout',
    exercises: [{ exerciseId: 'bench', name: 'Bench Press', sets: [{ weight: 99, reps: 5, completed: true }] }],
  }));
  expect(await screen.findByRole('heading', { name: 'Workout saved' })).toBeInTheDocument();
});

it('loads a repeated workout through the protected detail API', async () => {
  getSessionById.mockResolvedValueOnce({ data: { data: { session: {
    name: 'Monday bench',
    exercises: [{ exerciseId: 'bench', name: 'Bench Press', sets: [{ weight: 90, reps: 8 }] }],
  } } } });
  render(<MemoryRouter initialEntries={[{ pathname: '/new-session', state: { repeatId: 'saved' } }]}>
    <NewSession />
  </MemoryRouter>);
  expect(await screen.findByRole('spinbutton', { name: 'Bench Press set 1 weight' })).toHaveValue(90);
  expect(getSessionById).toHaveBeenCalledWith('saved');
});

it('keeps the repeat draft empty when the workout is unavailable to this user', async () => {
  getSessionById.mockRejectedValueOnce({ response: { status: 404 } });
  render(<MemoryRouter initialEntries={[{ pathname: '/new-session', state: { repeatId: 'other-account' } }]}>
    <NewSession />
  </MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not open that workout');
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
});

it('lets a user enter sets manually while history is slow and preserves the entry', async () => {
  let finishHistory;
  getLastSets.mockReturnValueOnce(new Promise((resolve) => { finishHistory = resolve; }));
  render(<MemoryRouter><NewSession /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Enter sets manually' }));
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
  fireEvent.click(screen.getByRole('button', { name: /bench press/i }));
  const weight = screen.getByRole('spinbutton', { name: 'Bench Press set 1 weight' });
  fireEvent.change(weight, { target: { value: '95' } });

  await act(async () => finishHistory({ data: { data: { lastSets: { bench: [{ weight: 100, reps: 5 }] } } } }));
  expect(weight).toHaveValue(95);
});
