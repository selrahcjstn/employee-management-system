import { cx } from '../../../shared/lib/cx';
import { InlineSvg } from '../../../shared/ui/InlineSvg';
import logoMark from '../../../assets/logo-mark.svg?raw';

interface LogoProps {
  /** `dark` is for the blue brand panel: a white tile with a blue glyph. */
  tone?: 'light' | 'dark';
  className?: string;
}

export function Logo({ tone = 'light', className }: LogoProps) {
  return (
    <InlineSvg
      source={logoMark}
      className={cx(
        'size-10 shrink-0',
        tone === 'dark' && 'logo-on-dark',
        className,
      )}
    />
  );
}
