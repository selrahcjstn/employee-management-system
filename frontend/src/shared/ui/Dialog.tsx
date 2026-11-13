import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';
import { IconButton } from './IconButton';

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  /** Called for Escape, a click on the overlay and the close button. */
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * A modal dialog (DESIGN.md 6.6): 480px wide at most, 24px padding, dimmed overlay.
 * Focus moves into it when it opens (give a field `autoFocus` to choose where), Tab and Shift+Tab
 * stay inside, Escape closes it, and focus goes back to whatever opened it. The page behind does
 * not scroll while it is open.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Sorted into page order: some selector engines (jsdom's) return a selector list grouped by part.
    const focusables = () =>
      [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].sort(
        (a, b) =>
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1,
      );

    // A field with `autoFocus` has already taken focus. Otherwise start on the first control.
    if (!panel.current?.contains(document.activeElement))
      focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (!panel.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={() => onClose()}
        className="absolute inset-0 animate-overlay-in bg-overlay"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative max-h-full w-full max-w-120 animate-dialog-in overflow-y-auto rounded-lg bg-neutral-0 p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <IconButton
            label="Close"
            onClick={() => onClose()}
            className="-mt-2 -mr-2"
          >
            <CloseIcon />
          </IconButton>
        </div>
        {description && (
          <p id={descriptionId} className="mt-2 text-sm text-neutral-600">
            {description}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
