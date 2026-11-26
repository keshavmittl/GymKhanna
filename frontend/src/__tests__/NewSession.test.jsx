import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import NewSession from '../pages/NewSession';
import { createSession, getLastSets, getSessionById } from '../api';

let userId;
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: userId } }) }));

beforeEach(() => {
  userId = 'sample-user';
  sessionStorage.clear();
  vi.clearAllMocks();
});

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

  const weight = screen.getByRole('slider', { name: 'Bench Press set 1 weight' });
  const reps = screen.getByRole('slider', { name: 'Bench Press set 1 reps' });
  expect(weight).toHaveValue('100');
  expect(weight).toHaveAttribute('min', '80');
  expect(weight).toHaveAttribute('max', '120');
  expect(reps).toHaveValue('5');
  fireEvent.change(weight, { target: { value: '105' } });
  fireEvent.change(reps, { target: { value: '7' } });
  expect(weight).toHaveValue('105');
  expect(reps).toHaveValue('7');
  fireEvent.click(screen.getByRole('button', { name: 'Save workout' }));

  await waitFor(() => expect(createSession).toHaveBeenCalledWith({
    name: 'Workout',
    exercises: [{ exerciseId: 'bench', name: 'Bench Press', sets: [{ weight: 105, reps: 7, completed: true }] }],
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
  expect(await screen.findByRole('slider', { name: 'Bench Press set 1 weight' })).toHaveValue('90');
  expect(getSessionById).toHaveBeenCalledWith('saved');
});

it('keeps the repeat draft empty when the workout is unavailable to this user', async () => {
  getSessionById.mockRejectedValueOnce({ response: { status: 404 } });
  render(<MemoryRouter initialEntries={[{ pathname: '/new-session', state: { repeatId: 'other-account' } }]}>
    <NewSession />
  </MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not open that workout');
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
});

it('lets a user enter sets manually while history is slow and preserves the entry', async () => {
  let finishHistory;
  getLastSets.mockReturnValueOnce(new Promise((resolve) => { finishHistory = resolve; }));
  render(<MemoryRouter><NewSession /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Enter sets manually' }));
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
  fireEvent.click(screen.getByRole('button', { name: /bench press/i }));
  fireEvent.click(screen.getByRole('button', { name: /enter exact Bench Press set 1 weight$/i }));
  const weight = screen.getByRole('spinbutton', { name: 'Exact Bench Press set 1 weight' });
  fireEvent.change(weight, { target: { value: '95.5' } });
  fireEvent.blur(weight);

  await act(async () => finishHistory({ data: { data: { lastSets: { bench: [{ weight: 100, reps: 5 }] } } } }));
  expect(screen.getByRole('button', { name: /enter exact Bench Press set 1 weight$/i })).toHaveTextContent('95.5');
});

it('copies an adjusted set and restores it after leaving, scoped to the account', async () => {
  const view = render(<MemoryRouter><NewSession /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Add exercise' }));
  fireEvent.click(await screen.findByRole('button', { name: /bench press/i }));
  const first = screen.getByRole('slider', { name: 'Bench Press set 1 weight' });
  fireEvent.change(first, { target: { value: '107' } });
  fireEvent.click(screen.getByRole('button', { name: 'Copy last set' }));
  expect(screen.getByRole('slider', { name: 'Bench Press set 2 weight' })).toHaveValue('107');
  view.unmount();

  const restored = render(<MemoryRouter><NewSession /></MemoryRouter>);
  expect(await screen.findByRole('slider', { name: 'Bench Press set 2 weight' })).toHaveValue('107');
  restored.unmount();

  userId = 'other-user';
  render(<MemoryRouter><NewSession /></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'No exercises yet' })).toBeInTheDocument();
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
});

it('retains the newer draft if an earlier save finishes after reopening the logger', async () => {
  let finishSave;
  createSession.mockReturnValueOnce(new Promise((resolve) => { finishSave = resolve; }));
  const view = render(
    <MemoryRouter initialEntries={['/new-session']}>
      <Link to="/journal">Leave logger</Link>
      <Link to="/new-session">Open logger</Link>
      <Routes>
        <Route path="/new-session" element={<NewSession />} />
        <Route path="/journal" element={<h1>Journal</h1>} />
        <Route path="/session/:id" element={<h1>Workout saved</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Add exercise' }));
  fireEvent.click(await screen.findByRole('button', { name: /bench press/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Save workout' }));
  fireEvent.click(screen.getByRole('link', { name: 'Leave logger' }));
  fireEvent.click(screen.getByRole('link', { name: 'Open logger' }));
  fireEvent.change(screen.getByRole('slider', { name: 'Bench Press set 1 weight' }), { target: { value: '110' } });

  await act(async () => finishSave({ data: { data: { session: { _id: 'saved' } } } }));
  expect(screen.getByRole('slider', { name: 'Bench Press set 1 weight' })).toHaveValue('110');
  view.unmount();
  render(<MemoryRouter><NewSession /></MemoryRouter>);
  expect(await screen.findByRole('slider', { name: 'Bench Press set 1 weight' })).toHaveValue('110');
});

it('copies an incomplete set with zero reps as incomplete', async () => {
  render(<MemoryRouter><NewSession /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Add exercise' }));
  fireEvent.click(await screen.findByRole('button', { name: /bench press/i }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bench Press set 1 completed' }));
  fireEvent.click(screen.getByRole('button', { name: /enter exact Bench Press set 1 reps$/i }));
  const reps = screen.getByRole('spinbutton', { name: 'Exact Bench Press set 1 reps' });
  fireEvent.change(reps, { target: { value: '0' } });
  fireEvent.blur(reps);
  fireEvent.click(screen.getByRole('button', { name: 'Copy last set' }));
  expect(screen.getByRole('checkbox', { name: 'Bench Press set 2 completed' })).not.toBeChecked();
  expect(screen.getByRole('slider', { name: 'Bench Press set 2 reps' })).toHaveValue('0');
});

it('restores edits to a saved repeat draft without reopening its source workout', async () => {
  getSessionById.mockResolvedValueOnce({ data: { data: { session: {
    name: 'Original bench',
    exercises: [{ exerciseId: 'bench', name: 'Bench Press', sets: [{ weight: 90, reps: 8 }] }],
  } } } });
  const repeatLog = () => <MemoryRouter initialEntries={[{ pathname: '/new-session', state: { repeatId: 'old-bench' } }]}>
    <NewSession />
  </MemoryRouter>;
  const view = render(repeatLog());
  fireEvent.change(await screen.findByRole('slider', { name: 'Bench Press set 1 weight' }), { target: { value: '95' } });
  view.unmount();

  getSessionById.mockRejectedValue({ response: { status: 404 } });
  try {
    render(repeatLog());
    expect(await screen.findByRole('slider', { name: 'Bench Press set 1 weight' })).toHaveValue('95');
    expect(getSessionById).toHaveBeenCalledTimes(1);
  } finally {
    getSessionById.mockReset();
  }
});
