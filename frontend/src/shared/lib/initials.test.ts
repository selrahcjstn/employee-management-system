import { initials } from './initials';
import { roleLabel } from './role-label';

describe('initials', () => {
  it('takes the first letter of the first two words, in capitals', () => {
    expect(initials('Ada Admin')).toBe('AA');
    expect(initials('charles justine mantes')).toBe('CJ');
  });

  it('handles one word, extra spaces and nothing at all', () => {
    expect(initials('Cher')).toBe('C');
    expect(initials('  Ada    Lovelace  ')).toBe('AL');
    expect(initials('')).toBe('');
    expect(initials('   ')).toBe('');
  });

  it('does not split a character outside the basic Unicode range', () => {
    expect(initials('\u{20BB7} Yoshi')).toBe('\u{20BB7}Y');
  });
});

describe('roleLabel', () => {
  it('spells out admin and capitalises any other role', () => {
    expect(roleLabel('admin')).toBe('Administrator');
    expect(roleLabel('viewer')).toBe('Viewer');
    expect(roleLabel('')).toBe('');
  });
});
