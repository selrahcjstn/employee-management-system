import { cx } from '../lib/cx';

interface InlineSvgProps {
  /** The text of an SVG file imported with `?raw`, for example `import grid from '../assets/grid.svg?raw'`. */
  source: string;
  /** Stretch the SVG to the height of its box instead of keeping its aspect ratio. */
  fill?: boolean;
  className?: string;
}

/**
 * Draws an SVG from src/assets inline. Inline (not an <img>) so the drawing can use the design
 * tokens as CSS variables and the page's fonts. Decorative: hidden from assistive technology.
 * Only ever pass the project's own bundled files, never user input.
 */
export function InlineSvg({ source, fill = false, className }: InlineSvgProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        fill ? 'inline-svg inline-svg-fill' : 'inline-svg',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: source }}
    />
  );
}
