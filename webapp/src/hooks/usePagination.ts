import { useState, useMemo } from 'react';

interface UsePaginationOptions<T> {
  data: T[];
  pageSize?: number;
  searchFields?: (keyof T)[];
  searchQuery?: string;
  customFilter?: (item: T) => boolean;
}

interface UsePaginationReturn<T> {
  /** Paginated data for current page */
  paginatedData: T[];
  /** All filtered data (before pagination slicing) */
  filteredData: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to first page (useful when search changes) */
  goToFirstPage: () => void;
}

export function usePagination<T>({
  data,
  pageSize: initialPageSize = 10,
  searchFields,
  searchQuery = '',
  customFilter,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply custom filter if provided
    if (customFilter) {
      filtered = filtered.filter(customFilter);
    }

    // Apply search if searchFields and searchQuery are provided
    if (searchFields && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value).toLowerCase().includes(query);
          }
          // Handle nested objects with _id and name patterns
          if (
            value &&
            typeof value === 'object' &&
            '_id' in (value as Record<string, unknown>) &&
            'name' in (value as Record<string, unknown>)
          ) {
            const obj = value as Record<string, unknown>;
            return typeof obj.name === 'string' && obj.name.toLowerCase().includes(query);
          }
          return false;
        })
      );
    }

    return filtered;
  }, [data, searchFields, searchQuery, customFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safeCurrentPage, pageSize]);

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToFirstPage = () => setCurrentPage(1);

  return {
    paginatedData,
    filteredData,
    currentPage: safeCurrentPage,
    totalPages,
    totalItems: filteredData.length,
    pageSize,
    setCurrentPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
    },
    nextPage,
    prevPage,
    goToFirstPage,
  };
}
