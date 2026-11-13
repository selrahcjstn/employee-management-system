import indexCss from './index.css?raw';
import tokens from './tokens.css?raw';

// The text of every component in the app (not the tests), read by Vite at build time.
const sources = Object.entries(
  import.meta.glob<string>(['../**/*.tsx', '!../**/*.test.tsx'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
).map(([path, text]) => ({ path, text }));

// Tailwind ships these two; every other animate-* class must come from the theme.
const BUILT_IN = new Set(['spin', 'pulse']);

describe('motion', () => {
  it('defines a keyframes block for every animation in the theme', () => {
    const animations = [
      ...tokens.matchAll(/--animate-([a-z-]+):\s*([a-z-]+)\s/g),
    ];
    expect(animations.length).toBeGreaterThanOrEqual(7);
    for (const [, name, keyframes] of animations) {
      expect(tokens, `animate-${name} needs @keyframes ${keyframes}`).toContain(
        `@keyframes ${keyframes}`,
      );
    }
  });

  it('only uses animate-* classes that exist, so a typo cannot silently do nothing', () => {
    const defined = new Set(
      [...tokens.matchAll(/--animate-([a-z-]+):/g)].map((m) => m[1]!),
    );
    const used = new Set<string>();
    for (const { text } of sources) {
      for (const m of text.matchAll(/\banimate-([a-z-]+)\b/g)) used.add(m[1]!);
    }
    expect(used.size).toBeGreaterThan(0);
    for (const name of used) {
      expect(
        defined.has(name) || BUILT_IN.has(name),
        `animate-${name} is not defined`,
      ).toBe(true);
    }
  });

  it('defines every anim-delay-N utility that the pages use', () => {
    const used = new Set<string>();
    for (const { text } of sources) {
      for (const m of text.matchAll(/\banim-delay-(\d+)\b/g)) used.add(m[1]!);
    }
    expect(used.size).toBeGreaterThan(0);
    for (const n of used) {
      expect(indexCss).toContain(`@utility anim-delay-${n}`);
    }
  });

  it('respects prefers-reduced-motion: no animation or transition waits, loops or lasts', () => {
    const block =
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n  \}/.exec(
        indexCss,
      )?.[1];
    expect(block).toBeDefined();
    expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/animation-delay:\s*0ms\s*!important/);
    expect(block).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it('keeps the SVG bar animation in CSS where the reduced-motion rule reaches it', () => {
    expect(indexCss).toMatch(/\.hero-bar\s*\{[^}]*animation:\s*grow-x/);
    expect(indexCss).toContain('@keyframes grow-x');
  });
});
