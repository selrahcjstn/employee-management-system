import axios from 'axios';

export interface ParsedApiError {
  /** A message that is safe to show to the user. */
  message: string;
  /** HTTP status, or undefined when the server could not be reached. */
  status: number | undefined;
  /** Messages for single fields, taken from 400 validation errors. */
  fieldErrors: Record<string, string>;
}

const NETWORK_MESSAGE =
  'Cannot reach the server. Check your connection and try again.';
const SERVER_MESSAGE = 'Something went wrong on the server. Please try again.';
const RATE_LIMIT_MESSAGE =
  'Too many attempts. Please wait a minute and try again.';

interface ErrorBody {
  message?: unknown;
  errors?: unknown;
}

/** "employeeNo must be shorter than..." or "body.name must not contain..." -> field and text. */
function toFieldError(line: string): [string, string] | undefined {
  const match = /^(?:body\.|query\.)?([A-Za-z_][\w]*)\s+(.+)$/.exec(line);
  return match ? [match[1]!, match[2]!] : undefined;
}

/**
 * Turns anything thrown by an API call into a message for the user, plus per-field messages for
 * validation errors. Raw server errors and stack traces are never returned.
 */
export function parseApiError(error: unknown): ParsedApiError {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return { message: SERVER_MESSAGE, status: undefined, fieldErrors: {} };
  }
  const status = error.response?.status;
  if (status === undefined) {
    return { message: NETWORK_MESSAGE, status, fieldErrors: {} };
  }

  const body = error.response?.data;
  const serverMessage =
    typeof body?.message === 'string' ? body.message : undefined;

  const fieldErrors: Record<string, string> = {};
  if (status === 400 && Array.isArray(body?.errors)) {
    for (const line of body.errors) {
      const parsed = typeof line === 'string' ? toFieldError(line) : undefined;
      // Keep the first message for a field; later ones are usually follow-ups.
      if (parsed && !(parsed[0] in fieldErrors))
        fieldErrors[parsed[0]] = parsed[1];
    }
  }

  if (status === 429) {
    return { message: RATE_LIMIT_MESSAGE, status, fieldErrors };
  }
  if (status >= 500) {
    return { message: SERVER_MESSAGE, status, fieldErrors };
  }
  // 400, 401, 404, 409 and so on carry short, deliberate messages from the API.
  return { message: serverMessage ?? SERVER_MESSAGE, status, fieldErrors };
}
