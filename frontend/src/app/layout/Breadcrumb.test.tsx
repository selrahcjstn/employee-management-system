import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { tokenStore } from '../../shared/api/token-store';
import { employeesServer, makeEmployee } from '../../test/employees-server';
import { Breadcrumb } from './Breadcrumb';

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Breadcrumb />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('Breadcrumb', () => {
  it('shows the group, then the current page', () => {
    renderAt('/dashboard');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByText('Overview')).toBeInTheDocument();
    expect(within(crumbs).getByText('Dashboard')).toHaveAttribute(
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

  describe('inside an employee workspace', () => {
    beforeEach(() => tokenStore.set('token'));

    it('shows Employees, the employee, then the tab, with Employees as a link back', async () => {
      const ana = makeEmployee({ firstName: 'Ana', lastName: 'Reyes' });
      employeesServer([ana]);
      renderAt(`/employees/${ana.id}/components`);

      const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(
        within(crumbs).getByRole('link', { name: 'Employees' }),
      ).toHaveAttribute('href', '/employees');
      expect(await within(crumbs).findByText('Ana Reyes')).toBeInTheDocument();
      expect(within(crumbs).getByText('Components')).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('still shows the tab before the name has loaded', () => {
      employeesServer([]);
      renderAt('/employees/00000000-0000-4000-8000-000000000000/computation');
      const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(within(crumbs).getByText('Computation')).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  });
});
