"use client";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 20,
  color = "#6366f1",
  interactive = false,
  onRate,
}: StarRatingProps) {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const filled = i <= Math.floor(rating);
    const halfFilled = !filled && i <= rating + 0.5;

    stars.push(
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? color : halfFilled ? color : "none"}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          cursor: interactive ? "pointer" : "default",
          opacity: filled || halfFilled ? 1 : 0.3,
          transition: "opacity 0.15s ease, transform 0.15s ease",
        }}
        onClick={() => interactive && onRate?.(i)}
        onMouseEnter={(e) => {
          if (interactive) {
            (e.currentTarget as SVGElement).style.transform = "scale(1.15)";
          }
        }}
        onMouseLeave={(e) => {
          if (interactive) {
            (e.currentTarget as SVGElement).style.transform = "scale(1)";
          }
        }}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }

  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {stars}
    </div>
  );
}
