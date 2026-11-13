type Listener = () => void;

/**
 * jsdom has no `matchMedia`. This installs a fake whose answer a test can change, firing the
 * `change` listeners like a browser does when a window is resized across a breakpoint.
 */
export function installMatchMedia(initiallyMatches = false) {
  let matches = initiallyMatches;
  const listeners = new Set<Listener>();

  window.matchMedia = ((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: Listener) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) =>
      listeners.delete(listener),
    addListener: (listener: Listener) => listeners.add(listener),
    removeListener: (listener: Listener) => listeners.delete(listener),
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  return {
    /** Pretend the window just crossed the breakpoint. */
    setMatches(value: boolean) {
      matches = value;
      listeners.forEach((listener) => listener());
    },
    listenerCount: () => listeners.size,
  };
}
