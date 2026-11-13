import { useLocation } from 'react-router';
import { ChevronRightIcon } from '../../shared/ui/icons';
import { findNav } from './nav-items';

/** Where you are: the group, then the page. The page's own h1 names it again below, in full. */
export function Breadcrumb() {
  const { pathname } = useLocation();
  const match = findNav(pathname);
  if (!match) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        <li className="hidden items-center gap-1 text-neutral-500 sm:flex">
          {match.group}
          <ChevronRightIcon size={16} className="text-neutral-400" />
        </li>
        <li aria-current="page" className="font-medium text-neutral-900">
          {match.item.label}
        </li>
      </ol>
    </nav>
  );
}
