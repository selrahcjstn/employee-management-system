import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const MAX_DEPTH = 10;

/** A UTF-16 surrogate with no partner: not valid Unicode text. */
const LONE_SURROGATE =
  /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;

/** The problem with a string, or undefined when it is safe to store and validate. */
function textProblem(value: string): string | undefined {
  if (value.includes('\u0000')) return 'must not contain null characters';
  if (LONE_SURROGATE.test(value)) return 'must be valid Unicode text';
  return undefined;
}

/** The first offending string as `path must ...`, or undefined. */
function findInvalidText(
  value: unknown,
  path: string,
  depth = 0,
): string | undefined {
  if (typeof value === 'string') {
    const problem = textProblem(value);
    return problem ? `${path} ${problem}` : undefined;
  }
  if (depth >= MAX_DEPTH || value === null || typeof value !== 'object') {
    return undefined;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = Array.isArray(value)
      ? `${path}[${key}]`
      : `${path}.${key}`;
    const found = findInvalidText(child, childPath, depth + 1);
    if (found) return found;
  }
  return undefined;
}

/**
 * Rejects text that cannot be handled safely, with a clear 400 at the edge:
 * PostgreSQL text cannot hold the NUL character, and a lone surrogate makes some
 * validators throw. Runs after the body parser, on the body and the query string.
 */
@Injectable()
export class RejectInvalidTextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const problem =
      findInvalidText(req.body, 'body') ?? findInvalidText(req.query, 'query');
    if (problem) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [problem],
      });
    }
    next();
  }
}
