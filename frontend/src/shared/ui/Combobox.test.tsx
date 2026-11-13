import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxOption } from './Combobox';

const OPTIONS: ComboboxOption[] = [
  { value: 'a', label: 'Ana Reyes', description: 'EMP-001' },
  { value: 'b', label: 'Ben Lim', description: 'EMP-002' },
  { value: 'c', label: 'Cara Santos', description: 'EMP-003' },
];

function Harness({
  onChange = () => {},
  loading = false,
  initial = null,
}: {
  onChange?: (value: string) => void;
  loading?: boolean;
  initial?: string | null;
}) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <Combobox
      label="Employee"
      options={OPTIONS}
      value={value}
      loading={loading}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

const box = () => screen.getByRole('combobox', { name: 'Employee' });

describe('Combobox', () => {
  it('starts closed and shows the chosen name', () => {
    render(<Harness initial="b" />);
    expect(box()).toHaveValue('Ben Lim');
    expect(box()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens on focus and lists every option with its description', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(box());

    expect(box()).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual([
      'Ana ReyesEMP-001',
      'Ben LimEMP-002',
      'Cara SantosEMP-003',
    ]);
  });

  it('filters by name or by the description, ignoring case', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(box());

    await user.type(box(), 'lim');
    expect(screen.getAllByRole('option')).toHaveLength(1);

    await user.clear(box());
    await user.type(box(), 'emp-003');
    expect(
      screen.getByRole('option', { name: /Cara Santos/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(box(), 'zzz');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByText('No match for “zzz”')).toBeInTheDocument();
  });

  it('shows Loading while the options load', async () => {
    const user = userEvent.setup();
    render(<Harness loading />);
    await user.click(box());
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('moves with the arrow keys, wrapping around, and tells assistive tech which option is active', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(box());

    const active = () =>
      document.getElementById(box().getAttribute('aria-activedescendant')!)!;
    expect(active()).toHaveTextContent('Ana Reyes');
    await user.keyboard('{ArrowDown}');
    expect(active()).toHaveTextContent('Ben Lim');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(active()).toHaveTextContent('Cara Santos');
  });

  it('chooses the active option with Enter and closes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    await user.click(box());
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('b');
    expect(box()).toHaveValue('Ben Lim');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('chooses an option with the mouse', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    await user.click(box());
    await user.click(screen.getByRole('option', { name: /Cara Santos/ }));

    expect(onChange).toHaveBeenCalledWith('c');
    expect(box()).toHaveValue('Cara Santos');
  });

  it('marks the chosen option as selected', async () => {
    const user = userEvent.setup();
    render(<Harness initial="b" />);
    await user.click(box());
    expect(screen.getByRole('option', { name: /Ben Lim/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('closes with Escape and puts the chosen name back, without letting the Escape through', async () => {
    const outside = vi.fn();
    document.addEventListener('keydown', outside);
    const user = userEvent.setup();
    render(<Harness initial="b" />);
    await user.click(box());
    await user.type(box(), 'zz');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(box()).toHaveValue('Ben Lim');
    expect(
      outside.mock.calls.filter(([event]) => event.key === 'Escape'),
    ).toHaveLength(0);
    document.removeEventListener('keydown', outside);
  });

  it('closes when focus leaves', async () => {
    const user = userEvent.setup();
    render(<Harness initial="b" />);
    await user.click(box());
    await user.tab();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
