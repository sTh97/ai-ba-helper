export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export const getTotalPages = (totalItems, pageSize) =>
  Math.max(1, Math.ceil(totalItems / pageSize));

export const getPageSlice = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

/**
 * Builds incremental page numbers: sliding window of up to 5 pages,
 * with ellipsis and last page when needed.
 * e.g. [1, 2, 3, 4, 5, "ellipsis", 20]
 */
export const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const windowSize = 5;
  let start = Math.max(1, Math.min(currentPage - 2, totalPages - windowSize + 1));
  const end = start + windowSize - 1;

  const pages = [];

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("ellipsis-start");
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("ellipsis-end");
    pages.push(totalPages);
  }

  return pages;
};
