import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from './api/health';

export default function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
  });

  return (
    <main>
      <h1>Employee Onboarding and Salary Management</h1>
      <p role="status">
        {health.isPending && 'Checking the API…'}
        {health.isError &&
          'The API is not reachable. Is the backend running on port 3000?'}
        {health.isSuccess &&
          `API ${health.data.status}, database ${health.data.database}`}
      </p>
    </main>
  );
}
