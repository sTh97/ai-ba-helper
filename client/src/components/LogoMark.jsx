const LogoMark = ({ size = 28 }) => (
  <div
    className="flex items-center justify-center bg-accent rounded-lg shrink-0"
    style={{ width: size, height: size }}
  >
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 18 18" fill="none" aria-hidden>
      {[0, 1].map((row) =>
        [0, 1, 2].map((col) => {
          const highlighted = row === 0 && col === 2;
          return (
            <rect
              key={`${row}-${col}`}
              x={col * 6 + 1}
              y={row * 8 + 1}
              width={4}
              height={6}
              rx={1}
              fill={highlighted ? "#fff" : "rgba(255,255,255,0.45)"}
            />
          );
        }),
      )}
    </svg>
  </div>
);

export default LogoMark;
