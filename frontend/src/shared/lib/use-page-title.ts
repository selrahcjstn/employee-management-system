import { useEffect } from 'react';
import { APP_NAME } from '../config';

/**
 * Sets the browser tab title to "part | part | App name" while the page is on screen, and puts the
 * previous title back when it goes away. Pass the most specific part first.
 */
export function usePageTitle(...parts: (string | undefined)[]): void {
  const title = [...parts.filter(Boolean), APP_NAME].join(' | ');
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
