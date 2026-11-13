import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedFilter, SelectFilter } from './filters';
import { MiniStat } from './MiniStat';

describe('SegmentedFilter', () => {
  const options = [
    { value: 'all', label: 'All', count: 5 },
    { value: 'ready', label: 'Ready', count: 4 },
  ];

  it('is a labelled group of buttons with the chosen one pressed, each showing its count', () => {
    render(
      <SegmentedFilter
        label="Status"
        options={options}
        value="ready"
        onChange={() => {}}
      />,
    );
    const group = screen.getByRole('group', { name: 'Status' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ready\s*4/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /All\s*5/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reports the choice, and works from the keyboard', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedFilter
        label="Status"
        options={options}
        value="all"
        onChange={onChange}
      />,
    );
    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('ready');
  });

  it('leaves the count out when there is none', () => {
    render(
      <SegmentedFilter
        label="Mode"
        options={[{ value: 'a', label: 'Only' }]}
        value="a"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Only' })).toBeInTheDocument();
  });
});

describe('SelectFilter', () => {
  it('is a native select named by its label, and reports the choice', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectFilter
        label="Sort by"
        value="a"
        onChange={onChange}
        options={[
          { value: 'a', label: 'Name' },
          { value: 'b', label: 'Salary' },
        ]}
      />,
    );
    const select = screen.getByLabelText('Sort by');
    expect(select).toHaveValue('a');
    await user.selectOptions(select, 'Salary');
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('MiniStat', () => {
  it('shows the label, the value and a note, and can be marked as needing attention', () => {
    const { rerender, container } = render(
      <MiniStat label="Assigned" value="2 of 3" note="1 left" />,
    );
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    expect(screen.getByText('1 left')).toBeInTheDocument();
    expect(container.firstElementChild!.className).not.toMatch(/warning/);

    rerender(<MiniStat label="Assigned" value="2 of 3" attention />);
    expect(container.firstElementChild!.className).toMatch(/warning/);
  });
});

describe('SelectFilter control', () => {
  it('is a single bordered select with the label beside it, so there is no box inside a box', () => {
    render(
      <SelectFilter
        label="Sort by"
        value="a"
        onChange={() => {}}
        options={[{ value: 'a', label: 'Name' }]}
      />,
    );
    const select = screen.getByLabelText('Sort by');
    expect(select.className).toMatch(/\bborder\b/);
    expect(select.className).toMatch(/\brounded-md\b/);
    // The label is outside the bordered element, and nothing around the select has a border too.
    const wrapper = select.parentElement!;
    expect(wrapper.className).not.toMatch(/\bborder\b/);
    expect(wrapper.parentElement!.className).not.toMatch(/\bborder\b/);
    expect(screen.getByText('Sort by').parentElement).toBe(
      wrapper.parentElement,
    );
  });
});
