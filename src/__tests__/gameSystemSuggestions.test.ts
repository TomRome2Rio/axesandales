import { describe, expect, it } from 'vitest';
import { getGameSystemSuggestion } from '../utils/gameSystemSuggestions';

describe('getGameSystemSuggestion', () => {
  it('allows equal-count acronym matches through the ranking gate', () => {
    const result = getGameSystemSuggestion(
      'MWWBK',
      new Map([
        ['Men Who Would Be Kings', 3],
        ['Mork Borg', 2],
      ]),
    );

    expect(result).toMatchObject({
      name: 'Men Who Would Be Kings',
      count: 3,
      matchType: 'acronym',
    });
  });

  it('matches the plain acronym case before the prefix-acronym fallback', () => {
    const result = getGameSystemSuggestion(
      'C&C - The Great War',
      new Map([['Command and Colours - The Great War', 1]]),
    );

    expect(result).toMatchObject({
      name: 'Command and Colours - The Great War',
      count: 1,
      matchType: 'acronym',
    });
  });

  it('filters out lower-count candidates', () => {
    const result = getGameSystemSuggestion(
      'Men Who Would Be Kings',
      new Map([
        ['Men Who Would Be Kings', 3],
        ['MWWBK', 2],
      ]),
    );

    expect(result).toBeNull();
  });

  it('finds normalized proportional Levenshtein matches', () => {
    const result = getGameSystemSuggestion(
      'Warhammer 40K',
      new Map([['Warhammer 40,000', 2]]),
    );

    expect(result).toMatchObject({
      name: 'Warhammer 40,000',
      count: 2,
      matchType: 'levenshtein',
    });
  });
});
