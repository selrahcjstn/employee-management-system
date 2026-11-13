import { formatPeso } from '../../../shared/lib/format';
import { sumAmounts, toCentavos } from '../../../shared/lib/money';
import { MiniStat } from '../../../shared/ui/MiniStat';
import type { EmployeeComponent } from '../types';

/**
 * Three small numbers above the table: what the components add up to, how many there are, and the
 * largest one. Worked out in centavos from the amounts the API sent.
 */
export function ComponentsOverview({ items }: { items: EmployeeComponent[] }) {
  const amounts = items.map((item) => item.amount);
  const largest = items.reduce((best, item) =>
    toCentavos(item.amount) > toCentavos(best.amount) ? item : best,
  );

  return (
    <section
      aria-label="Components overview"
      className="grid gap-4 sm:grid-cols-3"
    >
      <MiniStat
        label="Total amount"
        value={formatPeso(sumAmounts(amounts))}
        note="Added to the basic salary each month"
      />
      <MiniStat
        label="How many"
        value={String(items.length)}
        note={items.length === 1 ? 'One component' : 'Different components'}
      />
      <MiniStat
        label="Largest"
        value={formatPeso(largest.amount)}
        note={largest.name}
      />
    </section>
  );
}
