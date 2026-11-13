import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

function Buttons() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success('Saved it')}>succeed</button>
      <button onClick={() => toast.error('Could not save')}>fail</button>
    </>
  );
}

const renderToasts = () =>
  render(
    <ToastProvider>
      <Buttons />
    </ToastProvider>,
  );

/** Moves the fake clock inside act() so React applies the resulting updates. */
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('toasts', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows a success toast as a status message and removes it after 4 seconds', () => {
    renderToasts();
    fireEvent.click(screen.getByText('succeed'));

    expect(screen.getByRole('status')).toHaveTextContent('Saved it');

    advance(3999);
    expect(screen.getByText('Saved it')).toBeInTheDocument();
    advance(2);
    expect(screen.queryByText('Saved it')).not.toBeInTheDocument();
  });

  it('keeps an error toast as an alert until it is dismissed', () => {
    renderToasts();
    fireEvent.click(screen.getByText('fail'));

    expect(screen.getByRole('alert')).toHaveTextContent('Could not save');
    advance(60_000);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('stacks several toasts, each on its own timer', () => {
    renderToasts();
    fireEvent.click(screen.getByText('succeed'));
    advance(2000);
    fireEvent.click(screen.getByText('succeed'));
    expect(screen.getAllByText('Saved it')).toHaveLength(2);

    advance(2001);
    expect(screen.getAllByText('Saved it')).toHaveLength(1);
  });
});
