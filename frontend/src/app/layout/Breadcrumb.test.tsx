import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Breadcrumb } from './Breadcrumb';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumb />
    </MemoryRouter>,
  );

describe('Breadcrumb', () => {
  it('shows the group, then the current page', () => {
    renderAt('/salary');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByText('Pay')).toBeInTheDocument();
    expect(within(crumbs).getByText('Salary')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(crumbs).getAllByRole('listitem')).toHaveLength(2);
  });

  it('keeps the group out of sight on the smallest screens, but the page is always there', () => {
    renderAt('/employees');
    expect(screen.getByText('People').closest('li')!.className).toMatch(
      /\bhidden\b.*sm:flex/,
    );
    expect(screen.getByText('Employees').closest('li')!.className).not.toMatch(
      /hidden/,
    );
  });

  it('draws nothing for a path that is not in the navigation', () => {
    const { container } = renderAt('/no/such/page');
    expect(container).toBeEmptyDOMElement();
  });
});
