import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('shows the initials in a 32px circle, hidden from assistive technology', () => {
    const { container } = render(<Avatar name="Ada Admin" />);
    const avatar = container.firstElementChild!;
    expect(avatar).toHaveTextContent('AA');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar.className).toMatch(/\bsize-8\b/);
  });

  it('can be the large 64px size', () => {
    const { container } = render(<Avatar name="Ada Admin" size="lg" />);
    expect(container.firstElementChild!.className).toMatch(/\bsize-16\b/);
  });
});
