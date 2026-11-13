import { redirectTarget } from './redirect';

describe('redirectTarget', () => {
  it('returns the page the user asked for, including its query string', () => {
    expect(redirectTarget({ from: '/employees' })).toBe('/employees');
    expect(redirectTarget({ from: '/employees?tab=pay#top' })).toBe(
      '/employees?tab=pay#top',
    );
  });

  it('falls back to the home page when there is nothing to return to', () => {
    expect(redirectTarget(null)).toBe('/employees');
    expect(redirectTarget(undefined)).toBe('/employees');
    expect(redirectTarget({})).toBe('/employees');
    expect(redirectTarget('/employees')).toBe('/employees');
  });

  it('never returns to the login page (that would loop)', () => {
    expect(redirectTarget({ from: '/login' })).toBe('/employees');
    expect(redirectTarget({ from: '/login?x=1' })).toBe('/employees');
  });

  it.each([
    '//evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    'employees',
    '',
    42,
    null,
  ])('refuses to redirect to %j', (from) => {
    expect(redirectTarget({ from })).toBe('/employees');
  });
});
