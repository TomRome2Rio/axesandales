import { distance } from 'fastest-levenshtein';

export type GameSystemSuggestion = {
  name: string;
  count: number;
  matchType: 'levenshtein' | 'prefix' | 'acronym' | 'prefix-acronym';
  distance?: number;
};

export type GameSystemCount = {
  name: string;
  count: number;
};

const SYMBOL_WORDS: Record<string, string> = {
  '&': 'and',
  '@': 'at',
  '+': 'plus',
  '/': 'slash',
  '#': 'number',
  '%': 'percent',
  '*': 'star',
};

export const normalizeForComparison = (value: string) => {
  const withSymbolsExpanded = value
    .replace(/[&@+#%*/]/g, match => ` ${SYMBOL_WORDS[match] || ' '} `)
    .toLowerCase();

  return withSymbolsExpanded
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

const compactComparison = (value: string) => normalizeForComparison(value).replace(/\s+/g, '');

export const buildAcronym = (value: string) =>
  normalizeForComparison(value)
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .join('');

export const splitHyphenatedName = (value: string) => {
  const [firstHalf = '', ...rest] = value.split(/\s*-\s*/);
  return {
    firstHalf: firstHalf.trim(),
    secondHalf: rest.join(' - ').trim(),
  };
};

export const getMatchTypeLabel = (matchType: GameSystemSuggestion['matchType']) => {
  switch (matchType) {
    case 'levenshtein':
      return 'Closest spelling match';
    case 'prefix':
      return 'Prefix match';
    case 'acronym':
      return 'Acronym match';
    case 'prefix-acronym':
      return 'Prefix + acronym match';
  }
};

const normalizeCounts = (counts: Map<string, number>) => {
  const entries = [...counts.entries()];
  const currentNames = new Set(entries.map(([name]) => name));

  return entries
    .map(([name, count]) => ({
      name,
      count,
      normalized: normalizeForComparison(name),
      compact: compactComparison(name),
      acronym: buildAcronym(name),
    }))
    .filter(candidate => currentNames.has(candidate.name));
};

export const getGameSystemSuggestion = (
  currentName: string,
  gameSystemCounts: Map<string, number>
): GameSystemSuggestion | null => {
  const currentCount = gameSystemCounts.get(currentName) ?? 0;
  const candidates = normalizeCounts(gameSystemCounts)
    .filter(candidate => candidate.name !== currentName && candidate.count >= currentCount);

  const currentNormalized = normalizeForComparison(currentName);
  const currentCompact = compactComparison(currentName);
  const currentAcronym = buildAcronym(currentName);

  const proportionalMatches = candidates
    .map(candidate => ({
      ...candidate,
      distance: distance(currentNormalized, candidate.normalized),
    }))
    .map(candidate => ({
      ...candidate,
      ratio: candidate.distance / Math.max(currentNormalized.length, candidate.normalized.length, 1),
    }))
    .filter(candidate => candidate.ratio <= 0.35)
    .sort((a, b) =>
      a.ratio - b.ratio ||
      a.distance - b.distance ||
      b.count - a.count ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  if (proportionalMatches[0]) {
    const { name, count, distance: candidateDistance } = proportionalMatches[0];
    return { name, count, matchType: 'levenshtein', distance: candidateDistance };
  }

  const prefixMatches = candidates
    .filter(candidate => (
      candidate.compact.startsWith(currentCompact) ||
      currentCompact.startsWith(candidate.compact) ||
      candidate.normalized.startsWith(currentNormalized) ||
      currentNormalized.startsWith(candidate.normalized)
    ))
    .sort((a, b) =>
      Math.abs(a.compact.length - currentCompact.length) - Math.abs(b.compact.length - currentCompact.length) ||
      b.count - a.count ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  if (prefixMatches[0]) {
    const { name, count } = prefixMatches[0];
    return { name, count, matchType: 'prefix' };
  }

  const acronymMatches = candidates
    .filter(candidate => (
      candidate.acronym === currentCompact ||
      currentAcronym === candidate.compact ||
      candidate.acronym === currentAcronym ||
      currentCompact === candidate.acronym
    ))
    .sort((a, b) =>
      b.count - a.count ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  if (acronymMatches[0]) {
    const { name, count } = acronymMatches[0];
    return { name, count, matchType: 'acronym' };
  }

  const prefixAcronymMatches = candidates
    .map(candidate => {
      const currentParts = splitHyphenatedName(currentName);
      const candidateParts = splitHyphenatedName(candidate.name);
      if (!currentParts.firstHalf || !currentParts.secondHalf || !candidateParts.firstHalf || !candidateParts.secondHalf) {
        return null;
      }

      const currentPrefixAcronym = buildAcronym(currentParts.firstHalf);
      const candidatePrefixAcronym = buildAcronym(candidateParts.firstHalf);
      if (!currentPrefixAcronym || !candidatePrefixAcronym || currentPrefixAcronym !== candidatePrefixAcronym) {
        return null;
      }

      const currentSuffix = normalizeForComparison(currentParts.secondHalf);
      const candidateSuffix = normalizeForComparison(candidateParts.secondHalf);
      if (!currentSuffix || !candidateSuffix) return null;

      const suffixDistance = distance(currentSuffix, candidateSuffix);
      const suffixRatio = suffixDistance / Math.max(currentSuffix.length, candidateSuffix.length, 1);

      return {
        ...candidate,
        distance: suffixDistance,
        ratio: suffixRatio,
      };
    })
    .filter((candidate): candidate is (typeof candidates[number] & { distance: number; ratio: number }) => Boolean(candidate))
    .filter(candidate => candidate.ratio <= 0.35)
    .sort((a, b) =>
      a.ratio - b.ratio ||
      a.distance - b.distance ||
      b.count - a.count ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  if (prefixAcronymMatches[0]) {
    const { name, count, distance: candidateDistance } = prefixAcronymMatches[0];
    return { name, count, matchType: 'prefix-acronym', distance: candidateDistance };
  }

  const absoluteMatches = candidates
    .map(candidate => ({
      ...candidate,
      distance: distance(currentNormalized, candidate.normalized),
    }))
    .filter(candidate => candidate.distance <= 5)
    .sort((a, b) =>
      a.distance - b.distance ||
      b.count - a.count ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  if (absoluteMatches[0]) {
    const { name, count, distance: candidateDistance } = absoluteMatches[0];
    return { name, count, matchType: 'levenshtein', distance: candidateDistance };
  }

  return null;
};
