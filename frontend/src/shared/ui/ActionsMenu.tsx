import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { IconButton } from './IconButton';
import { MoreIcon } from './icons';

export type ActionItem =
  { label: string; to: string } | { label: string; onSelect: () => void };

interface ActionsMenuProps {
  /** Names the button for screen readers, for example "Actions for Juan Dela Cruz". */
  label: string;
  items: ActionItem[];
}

const ITEM_CLASS =
  'flex h-10 w-full items-center rounded-md px-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900';

/**
 * A "more" button that opens a menu of actions. Same behavior as the account menu: focus moves into
 * it, the arrow keys move between items, Escape closes it and returns focus, and so does a click
 * outside.
 */
export function ActionsMenu({ label, items }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const nodes = [
      ...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
        []),
    ];
    const current = nodes.indexOf(document.activeElement as HTMLElement);
    const focusAt = (index: number) => {
      event.preventDefault();
      nodes[(index + nodes.length) % nodes.length]?.focus();
    };
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'ArrowDown':
        focusAt(current + 1);
        break;
      case 'ArrowUp':
        focusAt(current - 1);
        break;
      case 'Home':
        focusAt(0);
        break;
      case 'End':
        focusAt(nodes.length - 1);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={root} className="relative">
      <IconButton
        ref={trigger}
        label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <MoreIcon />
      </IconButton>
      {open && (
        <div
          id={menuId}
          ref={menu}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full right-0 z-30 mt-1 w-48 animate-menu-in rounded-lg border border-neutral-200 bg-neutral-0 p-2 text-left shadow-md"
        >
          {items.map((item) =>
            'to' in item ? (
              <Link
                key={item.label}
                role="menuitem"
                to={item.to}
                className={ITEM_CLASS}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  close(false);
                  item.onSelect();
                }}
                className={ITEM_CLASS}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
