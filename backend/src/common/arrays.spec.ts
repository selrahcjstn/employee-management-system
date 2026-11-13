import { chunk } from './arrays.js';

describe('chunk', () => {
  it('splits a list into pieces of at most the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('returns no pieces for an empty list, and one piece when it fits', () => {
    expect(chunk([], 3)).toEqual([]);
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it('keeps every item exactly once, in order', () => {
    const items = Array.from({ length: 2503 }, (_, i) => i);
    const pieces = chunk(items, 1000);
    expect(pieces.map((piece) => piece.length)).toEqual([1000, 1000, 503]);
    expect(pieces.flat()).toEqual(items);
  });
});
