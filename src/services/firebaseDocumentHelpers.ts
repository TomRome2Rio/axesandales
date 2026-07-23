export const compareFirestoreDocumentIds = (leftId: string, rightId: string): number => {
  const numA = parseInt(leftId.replace(/\D/g, ''), 10) || 0;
  const numB = parseInt(rightId.replace(/\D/g, ''), 10) || 0;
  const prefixA = leftId.replace(/\d/g, '');
  const prefixB = rightId.replace(/\d/g, '');
  if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
  return numA - numB;
};

export const sortFirestoreDocumentsById = <T extends { id: string }>(docs: T[]): T[] => {
  return [...docs].sort((left, right) => compareFirestoreDocumentIds(left.id, right.id));
};

export const slugifyFirestoreId = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};
