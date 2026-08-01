import { useEffect, useMemo, useState } from "react";
import "./Pagination.css";

export function usePagination(items, pageSize = 12) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => setPage(1), [items.length, pageSize]);
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return { page, pageCount, pageItems, setPage };
}

export default function Pagination({ page, pageCount, setPage, itemCount, label = "items" }) {
  if (pageCount <= 1) return null;

  return (
    <nav className="list-pagination" aria-label={`Pagination for ${label}`}>
      <span className="list-pagination__summary">{itemCount} {label}</span>
      <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
      <span className="list-pagination__page">Page {page} of {pageCount}</span>
      <button type="button" onClick={() => setPage(page + 1)} disabled={page === pageCount}>Next</button>
    </nav>
  );
}
