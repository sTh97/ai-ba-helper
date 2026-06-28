const cn = (...classes) => classes.filter(Boolean).join(" ");

const Table = ({
  title,
  icon: Icon,
  headers = [],
  rows = [],
  emptyMsg = "No data yet",
  className = "",
  onRowClick,
}) => (
  <div className={cn("bg-surface border border-border rounded-lg overflow-hidden flex flex-col", className)}>
    {title && (
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        {Icon && (
          <span className="flex text-muted">
            <Icon size={18} strokeWidth={1.75} />
          </span>
        )}
        <span className="font-display font-semibold text-sm text-primary">{title}</span>
      </div>
    )}
    {rows.length === 0 ? (
      <div className="px-5 py-7 text-center text-muted text-sm">{emptyMsg}</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[11px] text-muted uppercase tracking-wide font-medium border-b border-border bg-elevated"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.key ?? i}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                className={cn(
                  "border-b border-border transition-colors",
                  i % 2 === 1 && "bg-elevated/40",
                  onRowClick && "cursor-pointer hover:bg-elevated",
                )}
              >
                {(row.cells ?? row).map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-sm text-secondary align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default Table;
