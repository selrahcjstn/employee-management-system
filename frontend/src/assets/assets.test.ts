import tokens from '../styles/tokens.css?raw';

// Vite reads every SVG in this folder as text at build time, so the test needs no Node file APIs.
const modules = import.meta.glob<string>('./**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const files = Object.entries(modules).map(([path, text]) => ({
  name: path.replace('./', ''),
  text,
}));

describe('SVG assets (inlined into the page, so they must be safe and consistent)', () => {
  it('finds the icons, the login illustration set and the logo', () => {
    expect(files.map((f) => f.name).sort()).toEqual([
      'icons/alert-circle.svg',
      'icons/calculator.svg',
      'icons/check-circle.svg',
      'icons/chevron-down.svg',
      'icons/chevron-right.svg',
      'icons/eye-off.svg',
      'icons/eye.svg',
      'icons/list.svg',
      'icons/log-out.svg',
      'icons/menu.svg',
      'icons/panel-left.svg',
      'icons/pencil.svg',
      'icons/plus.svg',
      'icons/search.svg',
      'icons/users.svg',
      'icons/wallet.svg',
      'icons/x.svg',
      'login/hero-coin.svg',
      'login/hero-employee-card.svg',
      'login/hero-grid.svg',
      'login/hero-pay-card.svg',
      'login/hero-rates-card.svg',
      'logo-mark.svg',
    ]);
  });

  describe('icons', () => {
    const icons = files.filter((f) => f.name.startsWith('icons/'));

    it.each(icons)(
      '$name is a 24px line icon that takes its color from the text around it',
      ({ text }) => {
        expect(text).toContain('viewBox="0 0 24 24"');
        expect(text).toContain('stroke="currentColor"');
        expect(text).toContain('fill="none"');
        expect(text).toContain('stroke-width="2"');
        expect(text).not.toMatch(/\sstyle\s*=/);
        expect(text).not.toMatch(/<(text|image)\b/);
      },
    );
  });

  it.each(files)('$name is a plain SVG document', ({ text }) => {
    expect(text.trimStart().startsWith('<svg')).toBe(true);
    expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(text.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it.each(files)(
    '$name has no script, external reference or event handler',
    ({ text }) => {
      expect(text).not.toMatch(/<script/i);
      expect(text).not.toMatch(/<foreignObject/i);
      expect(text).not.toMatch(/<image/i);
      expect(text).not.toMatch(/\s(xlink:)?href\s*=\s*"(?!#)/i);
      expect(text).not.toMatch(/\son[a-z]+\s*=/i);
      expect(text).not.toMatch(/url\(\s*["']?https?:/i);
    },
  );

  it.each(files)(
    '$name takes every color from the design tokens, never a hard-coded value',
    ({ text }) => {
      expect(text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(text).not.toMatch(/\brgba?\(/i);
      expect(text).not.toMatch(/\bhsla?\(/i);
    },
  );

  it.each(files)(
    '$name only uses color variables that exist in tokens.css',
    ({ text }) => {
      const used = [...text.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]!);
      for (const name of used) {
        // --logo-tile and --logo-glyph are optional overrides that always carry a token fallback.
        if (name.startsWith('--logo-')) continue;
        expect(tokens, `${name} is not defined in tokens.css`).toContain(
          `${name}:`,
        );
      }
    },
  );

  it('uses no id twice across files, because all of them end up in the same page', () => {
    const ids = files.flatMap((f) =>
      [...f.text.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });
});
