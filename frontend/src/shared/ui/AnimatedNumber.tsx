import { useCountUp } from '../lib/use-count-up';

interface AnimatedNumberProps {
  value: number;
  /** Turns the number into text, for example as pesos. Defaults to the plain number. */
  format?: (value: number) => string;
}

/**
 * A number that counts up to `value`. Screen readers get the final text, not every step: while it
 * counts, the moving digits are hidden from them and the final text is read instead.
 */
export function AnimatedNumber({
  value,
  format = String,
}: AnimatedNumberProps) {
  const counting = useCountUp(value);
  if (counting === value) return <>{format(value)}</>;
  return (
    <>
      <span aria-hidden="true">{format(counting)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
