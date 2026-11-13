import { screen, within } from '@testing-library/react';
import { APP_NAME } from '../../../shared/config';
import { authServer, renderApp } from '../../../test/render-app';

async function openLoginPage() {
  authServer({ signedIn: false });
  const app = renderApp('/login');
  await screen.findByRole('button', { name: /sign in/i });
  return app;
}

describe('LoginPage', () => {
  it('has one h1, "Welcome back", and the form under it', async () => {
    await openLoginPage();
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Welcome back');
    expect(
      screen.getByText('Sign in to your account to continue.'),
    ).toBeInTheDocument();
  });

  it('shows the product pitch and the app name next to the form', async () => {
    await openLoginPage();
    const panel = screen.getByRole('region', { name: 'About this app' });
    expect(within(panel).getByText(APP_NAME)).toBeInTheDocument();
    expect(
      within(panel).getByText('Onboard people. Assign pay. See the numbers.'),
    ).toBeInTheDocument();
  });

  it('also shows the logo and name above the form, for screens without the brand panel', async () => {
    await openLoginPage();
    // One copy in the brand panel (hidden below 1024px by CSS) and one above the form (hidden from 1024px up).
    expect(screen.getAllByText(APP_NAME)).toHaveLength(2);
  });

  it('draws the illustration from the SVG assets: three cards, a coin, a grid and the logo', async () => {
    const { router } = await openLoginPage();
    expect(router.state.location.pathname).toBe('/login');
    const panel = screen.getByRole('region', { name: 'About this app' });
    const drawings = panel.querySelectorAll('.inline-svg > svg');
    // grid + employee card + pay card + rates card + coin + logo mark
    expect(drawings).toHaveLength(6);
    expect(panel.textContent).toContain('Juan D. Cruz');
    expect(panel.textContent).toContain('₱33,500.00');
    expect(panel.textContent).toContain('₱2.6672');
  });

  it('hides every decorative drawing from assistive technology', async () => {
    await openLoginPage();
    for (const svg of document.querySelectorAll('svg')) {
      expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
    }
    // The sample figures sit inside the hidden drawings, so a screen reader hears only the real content.
    expect(
      screen.getByText('Juan D. Cruz').closest('[aria-hidden="true"]'),
    ).not.toBeNull();
  });

  it('keeps animated pieces away from the keyboard: nothing in the brand panel can be focused', async () => {
    await openLoginPage();
    const panel = screen.getByRole('region', { name: 'About this app' });
    expect(panel.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(
      0,
    );
  });

  it('has no sign-up or registration link', async () => {
    await openLoginPage();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/there is no sign-up/i)).toBeInTheDocument();
  });
});
