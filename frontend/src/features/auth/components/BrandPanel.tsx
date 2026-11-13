import type { ReactNode } from 'react';
import { cx } from '../../../shared/lib/cx';
import { APP_NAME } from '../../../shared/config';
import { InlineSvg } from '../../../shared/ui/InlineSvg';
import heroCoin from '../../../assets/login/hero-coin.svg?raw';
import heroEmployeeCard from '../../../assets/login/hero-employee-card.svg?raw';
import heroGrid from '../../../assets/login/hero-grid.svg?raw';
import heroPayCard from '../../../assets/login/hero-pay-card.svg?raw';
import heroRatesCard from '../../../assets/login/hero-rates-card.svg?raw';
import { Logo } from './Logo';

interface FloatingProps {
  /** Position and size of the item inside the illustration. */
  className: string;
  /** Entrance delay utility, for example `anim-delay-3`. */
  delay: string;
  /** The idle animation: gentle bobbing for cards, a wobble for the coin. */
  idle: string;
  children: ReactNode;
}

/** The outer box fades in once; the inner box keeps moving. Two elements, so the transforms do not fight. */
function Floating({ className, delay, idle, children }: FloatingProps) {
  return (
    <div className={cx('absolute animate-fade-up', delay, className)}>
      <div className={cx('hero-shadow', idle)}>{children}</div>
    </div>
  );
}

/**
 * The blue half of the login page (large screens only): the product pitch and an illustration of
 * what the app does. The drawings are the SVG files in src/assets/login; they show sample values
 * only and are hidden from assistive technology.
 */
export function BrandPanel() {
  return (
    <section
      aria-label="About this app"
      className="relative hidden overflow-hidden bg-linear-to-br from-primary-800 to-primary-700 p-12 text-neutral-0 lg:flex lg:flex-col"
    >
      <InlineSvg
        source={heroGrid}
        fill
        className="pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-1/4 -bottom-1/4 aspect-square w-3/4 animate-drift rounded-full bg-primary-600/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 -left-1/4 aspect-square w-1/2 animate-drift rounded-full bg-primary-100/10 blur-3xl"
      />

      <div className="relative flex animate-fade-up items-center gap-2">
        <Logo tone="dark" />
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </div>

      <div className="relative mt-8 max-w-md animate-fade-up anim-delay-1">
        <p className="text-3xl font-bold">
          Onboard people. Assign pay. See the numbers.
        </p>
        <p className="mt-2 text-base text-primary-100">
          One place for employees, salaries and pay rates, in Philippine pesos.
        </p>
      </div>

      <div className="relative mt-8 flex flex-1 items-center justify-center">
        {/* A zigzag: employee top left, pay breakdown middle right, rates bottom left. No card
            covers another card's numbers. */}
        <div className="relative aspect-5/4 w-full max-w-lg">
          <Floating
            className="top-0 left-0 w-1/2"
            delay="anim-delay-2"
            idle="animate-float"
          >
            <InlineSvg source={heroEmployeeCard} />
          </Floating>
          <Floating
            className="top-1/4 right-0 w-1/2"
            delay="anim-delay-3"
            idle="animate-float-slow"
          >
            <InlineSvg source={heroPayCard} />
          </Floating>
          <Floating
            className="bottom-0 left-0 w-1/2"
            delay="anim-delay-4"
            idle="animate-float"
          >
            <InlineSvg source={heroRatesCard} />
          </Floating>
          <Floating
            className="top-0 right-4 w-1/6"
            delay="anim-delay-5"
            idle="animate-wobble"
          >
            <InlineSvg source={heroCoin} />
          </Floating>
        </div>
      </div>
    </section>
  );
}
