import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

const previous = () => screen.getByRole('button', { name: 'Previous' });
const next = () => screen.getByRole('button', { name: 'Next' });

describe('Pagination', () => {
  it('says which rows are shown and allows only Next on the first page', () => {
    render(
      <Pagination page={1} pageSize={10} total={25} onPageChange={() => {}} />,
    );
    expect(screen.getByText('Showing 1–10 of 25')).toBeInTheDocument();
    expect(previous()).toBeDisabled();
    expect(next()).toBeEnabled();
  });

  it('shows the short last page and allows only Previous', () => {
    render(
      <Pagination page={3} pageSize={10} total={25} onPageChange={() => {}} />,
    );
    expect(screen.getByText('Showing 21–25 of 25')).toBeInTheDocument();
    expect(previous()).toBeEnabled();
    expect(next()).toBeDisabled();
  });

  it('asks for the page before or after the current one', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination
        page={2}
        pageSize={10}
        total={25}
        onPageChange={onPageChange}
      />,
    );

    await user.click(next());
    await user.click(previous());

    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });

  it('draws nothing when there are no rows', () => {
    const { container } = render(
      <Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
