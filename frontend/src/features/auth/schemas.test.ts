import { loginSchema } from './schemas';

const messages = (input: unknown) => {
  const result = loginSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

describe('loginSchema', () => {
  it('accepts a valid email and any non-empty password, trimming the email', () => {
    const result = loginSchema.parse({
      email: '  admin@example.com  ',
      password: 'x',
    });
    expect(result).toEqual({ email: 'admin@example.com', password: 'x' });
  });

  it('requires both fields', () => {
    expect(messages({ email: '', password: '' })).toEqual([
      'Email is required',
      'Password is required',
    ]);
    expect(messages({ email: '   ', password: 'x' })).toEqual([
      'Email is required',
    ]);
  });

  it.each(['plain', 'a@', '@b.co', 'a b@c.co', 'a@b'])(
    'rejects the invalid email "%s"',
    (email) => {
      expect(messages({ email, password: 'x' })).toEqual([
        'Enter a valid email address',
      ]);
    },
  );

  it('applies the same length limits as the API (email 255, password 72)', () => {
    const longEmail = `${'a'.repeat(251)}@b.co`; // 256 characters
    expect(
      messages({ email: `${'a'.repeat(250)}@b.co`, password: 'x' }),
    ).toEqual([]); // exactly 255
    expect(messages({ email: longEmail, password: 'x' })).toContain(
      'Email must be 255 characters or fewer',
    );
    expect(messages({ email: 'a@b.co', password: 'x'.repeat(73) })).toEqual([
      'Password must be 72 characters or fewer',
    ]);
    expect(messages({ email: 'a@b.co', password: 'x'.repeat(72) })).toEqual([]);
  });

  it('does not trim the password: spaces can be part of it', () => {
    expect(
      loginSchema.parse({ email: 'a@b.co', password: '  secret  ' }).password,
    ).toBe('  secret  ');
  });
});
