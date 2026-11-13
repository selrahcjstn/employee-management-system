import { BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RejectInvalidTextMiddleware } from './reject-invalid-text.middleware.js';

const run = (req: Partial<Request>) => {
  const next = vi.fn();
  new RejectInvalidTextMiddleware().use(req as Request, {} as Response, next);
  return next;
};

describe('RejectInvalidTextMiddleware', () => {
  it('lets clean requests through', () => {
    const next = run({
      body: {
        name: 'Rice 😀 Allowance',
        nested: { list: ['a', 'b'] },
        amount: '10',
      },
      query: { search: 'cruz' },
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('lets requests without a body or query through', () => {
    expect(run({})).toHaveBeenCalledOnce();
    expect(run({ body: null, query: {} })).toHaveBeenCalledOnce();
  });

  it('ignores non-string values', () => {
    expect(
      run({ body: { n: 5, ok: true, nothing: null } }),
    ).toHaveBeenCalledOnce();
  });

  it.each([
    ['a body field', { body: { name: 'a\u0000b' } }, 'body.name'],
    ['a nested body field', { body: { a: { b: 'x\u0000' } } }, 'body.a.b'],
    ['an array item', { body: { list: ['ok', '\u0000'] } }, 'body.list[1]'],
    ['a query value', { query: { search: '\u0000' } }, 'query.search'],
    [
      'a query array item',
      { query: { tag: ['ok', 'b\u0000'] } },
      'query.tag[1]',
    ],
  ])('rejects a NUL character in %s with 400', (_label, req, location) => {
    expect.assertions(3);
    try {
      run(req as unknown as Partial<Request>);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        errors: string[];
      };
      expect(response.errors[0]).toContain(location);
      expect(response.errors[0]).toContain('null characters');
    }
  });

  it.each([
    ['a lone high surrogate', 'x\ud800y'],
    ['a lone low surrogate', '\udc00'],
    ['a reversed surrogate pair', '\ude00\ud83d'],
  ])('rejects %s as invalid Unicode', (_label, text) => {
    expect.assertions(2);
    try {
      run({ body: { email: text } });
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        errors: string[];
      };
      expect(response.errors[0]).toBe('body.email must be valid Unicode text');
    }
  });

  it('accepts a valid surrogate pair (emoji)', () => {
    expect(run({ body: { name: '😀' } })).toHaveBeenCalledOnce();
  });

  it('does not recurse forever on a deeply nested body', () => {
    let deep: Record<string, unknown> = { value: 'x' };
    for (let i = 0; i < 1000; i++) deep = { child: deep };
    expect(run({ body: deep })).toHaveBeenCalledOnce();
  });
});
