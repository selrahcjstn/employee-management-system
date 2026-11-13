/**
 * The access token lives here, in a module variable, and nowhere else: never in localStorage,
 * sessionStorage or a cookie. A page reload loses it on purpose; the session is then restored
 * from the httpOnly refresh cookie.
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
  },
};

type Listener = () => void;
const expiredListeners = new Set<Listener>();

/** Lets the API layer tell the auth state that the session cannot be recovered. */
export const sessionEvents = {
  onExpired(listener: Listener): () => void {
    expiredListeners.add(listener);
    return () => {
      expiredListeners.delete(listener);
    };
  },
  expired(): void {
    expiredListeners.forEach((listener) => listener());
  },
};
