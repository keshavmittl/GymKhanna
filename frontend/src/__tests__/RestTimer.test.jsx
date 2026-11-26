import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import RestTimer from '../components/RestTimer';

it('counts down from the chosen duration, pauses and announces completion', () => {
  vi.useFakeTimers();
  try {
    render(<RestTimer />);
    fireEvent.change(screen.getByLabelText('Rest duration'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start rest' }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole('timer')).toHaveTextContent('0:50');
    fireEvent.click(screen.getByRole('button', { name: 'Pause rest' }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole('timer')).toHaveTextContent('0:50');
    fireEvent.click(screen.getByRole('button', { name: 'Resume rest' }));
    act(() => vi.advanceTimersByTime(50_000));
    expect(screen.getByRole('status')).toHaveTextContent('Rest complete');
  } finally {
    vi.useRealTimers();
  }
});
