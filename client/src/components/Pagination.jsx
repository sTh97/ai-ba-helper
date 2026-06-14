import { PAGE_SIZE_OPTIONS, getPageNumbers, getTotalPages } from "../utils/pagination";

const Pagination = ({ totalItems, page, pageSize, onPageChange, onPageSizeChange }) => {
  const totalPages = getTotalPages(totalItems, pageSize);

  if (totalItems === 0) return null;

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const pageNumbers = getPageNumbers(safePage, totalPages);

  const btnBase = {
    minWidth: 32,
    height: 32,
    padding: "0 8px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const activeBtn = {
    ...btnBase,
    background: "var(--accent-soft)",
    border: "1px solid var(--accent)33",
    color: "var(--accent)",
    fontWeight: 600,
  };

  return (
    <div style={{
      padding: "14px 20px",
      borderTop: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-muted)" }}>
        <span>
          {start}–{end} of {totalItems}
        </span>
        <span style={{ color: "var(--border-bright)" }}>|</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: "5px 8px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          style={{ ...btnBase, opacity: safePage <= 1 ? 0.4 : 1, cursor: safePage <= 1 ? "not-allowed" : "pointer" }}
        >
          ‹
        </button>

        {pageNumbers.map((p) =>
          typeof p === "number" ? (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={p === safePage ? activeBtn : btnBase}
            >
              {p}
            </button>
          ) : (
            <span
              key={p}
              style={{ padding: "0 4px", color: "var(--text-muted)", fontSize: 12, userSelect: "none" }}
            >
              …
            </span>
          )
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          style={{ ...btnBase, opacity: safePage >= totalPages ? 0.4 : 1, cursor: safePage >= totalPages ? "not-allowed" : "pointer" }}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
