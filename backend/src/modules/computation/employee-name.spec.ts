import { formatEmployeeName } from './employee-name.js';

describe('formatEmployeeName', () => {
  it('puts a capitalised middle initial between first and last name', () => {
    expect(formatEmployeeName('Juan', 'dela', 'Cruz')).toBe('Juan D. Cruz');
  });

  it('omits the initial when there is no middle name', () => {
    expect(formatEmployeeName('Juan', null, 'Cruz')).toBe('Juan Cruz');
    expect(formatEmployeeName('Juan', '', 'Cruz')).toBe('Juan Cruz');
  });

  it('does not split a character outside the BMP in half', () => {
    const name = formatEmployeeName('Ana', '\u{20BB7}', 'Reyes');
    expect(name).toBe('Ana \u{20BB7}. Reyes');
    expect(name).not.toMatch(
      /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/,
    );
  });

  it('keeps an accented initial intact', () => {
    expect(formatEmployeeName('José', 'ñandú', 'Peña')).toBe('José Ñ. Peña');
  });
});
