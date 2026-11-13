import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../../shared/api/token-store';
import { installMatchMedia } from '../../test/match-media';
import { authServer, renderApp } from '../../test/render-app';
import { SIDEBAR_STORAGE_KEY } from './use-sidebar-state';

async function openApp() {
  authServer({ signedIn: true });
  const app = renderApp('/employees');
  await screen.findByRole('heading', { name: 'Employees' });
  return { ...app, user: userEvent.setup() };
}

const sidebar = () => document.getElementById('app-sidebar')!;
const mainArea = () => document.getElementById('main')!;
const openButton = () =>
  screen.getByRole('button', { name: 'Open navigation' });

describe('AppLayout', () => {
  beforeEach(() => {
    tokenStore.set(null);
    localStorage.clear();
    sessionStorage.clear();
    installMatchMedia(false);
  });

  describe('sidebar', () => {
    it('groups the pages under Overview, People and Pay, with the current page marked', async () => {
      await openApp();
      const nav = screen.getByRole('navigation', { name: 'Main' });

      const people = within(nav).getByRole('list', { name: 'People' });
      expect(
        within(people).getByRole('link', { name: 'Employees' }),
      ).toHaveAttribute('aria-current', 'page');

      const pay = within(nav).getByRole('list', { name: 'Pay' });
      expect(within(pay).getAllByRole('listitem')).toHaveLength(3);
      expect(
        within(pay).getByRole('link', { name: 'Salary' }),
      ).not.toHaveAttribute('aria-current');
      expect(within(nav).getAllByRole('link')).toHaveLength(4);
    });

    it('shows pages that are not built yet as disabled, each with a "Soon" label', async () => {
      await openApp();
      const pay = screen.getByRole('list', { name: 'Pay' });

      for (const name of ['Computation']) {
        const item = within(pay)
          .getByText(name)
          .closest('[aria-disabled="true"]');
        expect(item, `${name} should be disabled`).not.toBeNull();
        expect(
          within(item as HTMLElement).getByText('Soon'),
        ).toBeInTheDocument();
      }
      expect(within(pay).getAllByRole('link')).toHaveLength(2);
    });

    it('shows the logo and the app name on two lines', async () => {
      await openApp();
      const aside = within(sidebar());
      expect(aside.getByText('Employee & Salary')).toBeInTheDocument();
      expect(aside.getByText('Management')).toBeInTheDocument();
      expect(sidebar().querySelector('.inline-svg > svg')).not.toBeNull();
    });

    it('marks the current page with a bar on the sidebar edge', async () => {
      await openApp();
      const link = screen.getByRole('link', { name: 'Employees' });
      expect(
        link.querySelector('span[aria-hidden="true"].bg-primary-600'),
      ).not.toBeNull();
      expect(link.className).toMatch(/bg-primary-50/);
      expect(link.className).toMatch(/text-primary-700/);
    });
  });

  describe('header', () => {
    it('shows where you are: the group, then the page', async () => {
      await openApp();
      const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(within(crumbs).getByText('People')).toBeInTheDocument();
      expect(within(crumbs).getByText('Employees')).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('has the account menu with the user name, and no loose Logout button', async () => {
      await openApp();
      expect(
        screen.getByRole('button', { name: 'Account menu, Ada Admin' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Ada Admin')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /^logout$/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it('has a skip link to the main content', async () => {
      await openApp();
      expect(
        screen.getByRole('link', { name: 'Skip to content' }),
      ).toHaveAttribute('href', '#main');
    });
  });

  describe('collapsing the sidebar to an icon rail', () => {
    it('toggles between expanded and collapsed, keeping every link readable by screen readers', async () => {
      const { user } = await openApp();
      const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(sidebar().className).not.toMatch(/lg:w-18/);

      await user.click(toggle);

      const expand = screen.getByRole('button', { name: 'Expand sidebar' });
      expect(expand).toHaveAttribute('aria-expanded', 'false');
      expect(sidebar().className).toMatch(/lg:w-18/);
      expect(
        sidebar().parentElement!.querySelector('[inert], .lg\\:pl-18'),
      ).not.toBeNull();
      // The text is squeezed away visually but stays in the page, so the link keeps its name.
      const link = screen.getByRole('link', { name: 'Employees' });
      expect(link.querySelector('span.lg\\:opacity-0')).not.toBeNull();

      await user.click(expand);
      expect(
        screen.getByRole('button', { name: 'Collapse sidebar' }),
      ).toBeInTheDocument();
      expect(sidebar().className).not.toMatch(/lg:w-18/);
    });

    it('moves the page content over to make room', async () => {
      const { user } = await openApp();
      const content = mainArea().parentElement!;
      expect(content.className).toMatch(/lg:pl-60/);

      await user.click(
        screen.getByRole('button', { name: 'Collapse sidebar' }),
      );
      expect(content.className).toMatch(/lg:pl-18/);
      expect(content.className).not.toMatch(/lg:pl-60/);
    });

    it('shows a label beside an icon in the rail, and only there', async () => {
      const { user } = await openApp();
      expect(
        screen.queryByText('Computation (coming soon)'),
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByRole('button', { name: 'Collapse sidebar' }),
      );

      const tooltip = screen.getByText('Computation (coming soon)');
      expect(tooltip).toHaveAttribute('aria-hidden', 'true');
      expect(
        screen.getByText('Employees', { selector: '[aria-hidden="true"]' }),
      ).toBeInTheDocument();
    });

    it('remembers the choice', async () => {
      const { user } = await openApp();
      await user.click(
        screen.getByRole('button', { name: 'Collapse sidebar' }),
      );
      expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('true');

      await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('false');
    });

    it('starts collapsed when it was left collapsed', async () => {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, 'true');
      await openApp();
      expect(
        screen.getByRole('button', { name: 'Expand sidebar' }),
      ).toBeInTheDocument();
      expect(sidebar().className).toMatch(/lg:w-18/);
    });

    it('still works when the browser blocks storage', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const { user } = await openApp();

      expect(
        screen.getByRole('button', { name: 'Collapse sidebar' }),
      ).toBeInTheDocument();
      await user.click(
        screen.getByRole('button', { name: 'Collapse sidebar' }),
      );
      expect(
        screen.getByRole('button', { name: 'Expand sidebar' }),
      ).toBeInTheDocument();
      vi.restoreAllMocks();
    });
  });

  describe('drawer on small screens', () => {
    it('is hidden at first and opens from the menu button, with focus on its close button', async () => {
      const { user } = await openApp();
      expect(sidebar().className).toMatch(/\binvisible\b/);
      expect(openButton()).toHaveAttribute('aria-expanded', 'false');

      await user.click(openButton());

      expect(openButton()).toHaveAttribute('aria-expanded', 'true');
      expect(sidebar().className).toMatch(/\bvisible\b/);
      expect(sidebar().className).not.toMatch(/\binvisible\b/);
      expect(
        screen.getByRole('button', { name: 'Close navigation' }),
      ).toHaveFocus();
    });

    it('makes the page behind it inert while it is open, so Tab cannot reach it', async () => {
      const { user } = await openApp();
      expect(mainArea().closest('[inert]')).toBeNull();

      await user.click(openButton());
      expect(mainArea().closest('[inert]')).not.toBeNull();

      await user.keyboard('{Escape}');
      expect(mainArea().closest('[inert]')).toBeNull();
    });

    it('closes with Escape and gives focus back to the button that opened it', async () => {
      const { user } = await openApp();
      await user.click(openButton());

      await user.keyboard('{Escape}');

      expect(openButton()).toHaveAttribute('aria-expanded', 'false');
      expect(openButton()).toHaveFocus();
    });

    it('closes from its close button and from a click on the overlay, returning focus both times', async () => {
      const { user } = await openApp();

      await user.click(openButton());
      await user.click(
        screen.getByRole('button', { name: 'Close navigation' }),
      );
      expect(openButton()).toHaveAttribute('aria-expanded', 'false');
      expect(openButton()).toHaveFocus();

      await user.click(openButton());
      const overlay = document.querySelector<HTMLElement>('.bg-overlay')!;
      await user.click(overlay);
      expect(openButton()).toHaveAttribute('aria-expanded', 'false');
      expect(openButton()).toHaveFocus();
    });

    it('closes when a link is followed and moves focus to the page content', async () => {
      const { user, router } = await openApp();
      await user.click(openButton());

      await user.click(screen.getByRole('link', { name: 'Employees' }));

      expect(openButton()).toHaveAttribute('aria-expanded', 'false');
      expect(router.state.location.pathname).toBe('/employees');
      expect(mainArea()).toHaveFocus();
    });

    it('closes by itself when the window grows wide enough to show the sidebar', async () => {
      const media = installMatchMedia(false);
      const { user } = await openApp();
      await user.click(openButton());
      expect(openButton()).toHaveAttribute('aria-expanded', 'true');

      act(() => media.setMatches(true));

      expect(openButton()).toHaveAttribute('aria-expanded', 'false');
      expect(mainArea().closest('[inert]')).toBeNull();
    });

    it('stops listening for window size changes when the layout goes away', async () => {
      const media = installMatchMedia(false);
      await openApp();
      expect(media.listenerCount()).toBe(1);
      const { default: cleanup } = await import('@testing-library/react').then(
        (m) => ({
          default: m.cleanup,
        }),
      );
      cleanup();
      expect(media.listenerCount()).toBe(0);
    });
  });
});
