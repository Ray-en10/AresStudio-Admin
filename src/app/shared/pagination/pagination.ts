export function getPaginationPages(currentPage: number, pageCount: number): number[] {
  const firstPage = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const lastPage = Math.min(pageCount, firstPage + 4);
  return Array.from({ length: Math.max(0, lastPage - firstPage + 1) }, (_, index) => firstPage + index);
}
