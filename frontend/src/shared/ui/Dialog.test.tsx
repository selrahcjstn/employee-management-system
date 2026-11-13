import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

function Harness({ onClose = () => {}, autoFocusField = false }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <button>Other button</button>
      <Dialog
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Edit thing"
        description="Change what you need."
      >
        <input aria-label="First" autoFocus={autoFocusField} />
        <input aria-label="Second" />
        <button>Save</button>
      </Dialog>
    </>
  );
}

async function openDialog(props: Parameters<typeof Harness>[0] = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  await user.click(screen.getByRole('button', { name: 'Open' }));
  return user;
}

describe('Dialog', () => {
  it('draws nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a modal dialog named by its title and described by its description', async () => {
    await openDialog();
    const dialog = screen.getByRole('dialog', { name: 'Edit thing' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Change what you need.');
  });

  it('moves focus into the dialog when it opens', async () => {
    await openDialog();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('lets a field with autoFocus take focus instead', async () => {
    await openDialog({ autoFocusField: true });
    expect(screen.getByLabelText('First')).toHaveFocus();
  });

  it('wraps Tab from the last control to the first, and Shift+Tab the other way', async () => {
    await openDialog();
    const close = screen.getByRole('button', { name: 'Close' });
    const save = screen.getByRole('button', { name: 'Save' });

    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(save).toHaveFocus();

    fireEvent.keyDown(save, { key: 'Tab' });
    expect(close).toHaveFocus();
  });

  it('pulls focus back in when it has strayed outside the dialog', async () => {
    await openDialog();
    const other = screen.getByRole('button', { name: 'Other button' });
    other.focus();

    fireEvent.keyDown(other, { key: 'Tab' });

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('closes with Escape and gives focus back to the button that opened it', async () => {
    const onClose = vi.fn();
    const user = await openDialog({ onClose });

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('closes from the close button and the overlay, but not from a click inside', async () => {
    const onClose = vi.fn();
    const user = await openDialog({ onClose });

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(document.body.querySelector<HTMLElement>('.bg-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('stops the page behind it from scrolling, and lets it scroll again afterwards', async () => {
    const user = await openDialog();
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
  });
});
