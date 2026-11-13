/** The highest amount the API accepts is 99,999,999.99: at most 8 digits before the point, 2 after. */
const MAX_WHOLE_DIGITS = 8;

/**
 * Money is counted in whole centavos in a BigInt, so adding many amounts has no float error.
 * "30000.50" -> 3000050n.
 */
export function toCentavos(amount: string): bigint {
  const [whole = '0', decimals = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(decimals.padEnd(2, '0').slice(0, 2));
}

/** 3000050n -> "30000.50", the decimal string the formatters expect. */
export function centavosToAmount(centavos: bigint): string {
  const whole = centavos / 100n;
  const decimals = (centavos % 100n).toString().padStart(2, '0');
  return `${whole}.${decimals}`;
}

/** The sum of decimal-string amounts, exact to the centavo: "0.10" + "0.20" is "0.30", never 0.30000000000000004. */
export function sumAmounts(amounts: readonly string[]): string {
  return centavosToAmount(
    amounts.reduce((sum, amount) => sum + toCentavos(amount), 0n),
  );
}

/** The average of decimal-string amounts, rounded half up to the centavo; null for no amounts. */
export function averageAmount(amounts: readonly string[]): string | null {
  if (amounts.length === 0) return null;
  const count = BigInt(amounts.length);
  const sum = amounts.reduce((total, amount) => total + toCentavos(amount), 0n);
  return centavosToAmount((sum * 2n + count) / (count * 2n));
}

/** "30000" and "30000.5" become "30000.00" and "30000.50": one spelling to compare and to send. */
export function normalizeAmount(value: string): string {
  const [whole = '0', decimals = ''] = value.trim().split('.');
  return `${whole.replace(/^0+(?=\d)/, '')}.${decimals.padEnd(2, '0')}`;
}

interface AmountRules {
  /** What the amount is called in messages: "Salary" gives "Salary must be greater than 0". */
  name: string;
  /** The message for an empty field. */
  required: string;
  /** A sample shown when the text is not a number. */
  example: string;
  /** Whether 0 is allowed. A basic salary must be above 0; a component may be 0. */
  allowZero: boolean;
}

/**
 * Checks an amount typed as text (money never goes through a float) against the API's rules: a plain
 * number, at most 2 decimals, at most 99,999,999.99, and above 0 unless zero is allowed.
 * Returns the message to show, or undefined when the amount is fine.
 */
export function checkAmount(
  input: string,
  { name, required, example, allowZero }: AmountRules,
): string | undefined {
  const value = input.trim();
  if (!value) return required;
  if (value.startsWith('-')) {
    return allowZero
      ? `${name} cannot be negative`
      : `${name} must be greater than 0`;
  }
  const match = /^(\d+)(?:\.(\d*))?$/.exec(value);
  if (!match) return `Enter a number, for example ${example} or ${example}.50`;
  const [, whole = '', decimals = ''] = match;
  if (decimals.length > 2) return 'Use at most 2 decimal places';
  if (!allowZero && /^0*$/.test(whole + decimals)) {
    return `${name} must be greater than 0`;
  }
  if (whole.replace(/^0+/, '').length > MAX_WHOLE_DIGITS) {
    return `${name} cannot be more than ₱99,999,999.99`;
  }
  return undefined;
}
