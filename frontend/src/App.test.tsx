import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import App from './App';
import { fetchHealth } from './api/health';

vi.mock('./api/health');

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('shows the heading and that it is checking the API', () => {
    vi.mocked(fetchHealth).mockReturnValue(new Promise(() => undefined));
    renderApp();
    expect(
      screen.getByRole('heading', { name: /employee onboarding/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Checking the API');
  });

  it('shows the API and database state when the backend answers', async () => {
    vi.mocked(fetchHealth).mockResolvedValue({ status: 'ok', database: 'up' });
    renderApp();
    expect(await screen.findByText('API ok, database up')).toBeInTheDocument();
  });

  it('tells the user when the backend cannot be reached', async () => {
    vi.mocked(fetchHealth).mockRejectedValue(new Error('Network Error'));
    renderApp();
    expect(
      await screen.findByText(/api is not reachable/i),
    ).toBeInTheDocument();
  });
});
