"use client";

import StarRating from "./StarRating";

interface ReviewCardProps {
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
  featured?: boolean;
}

function formatDateCZ(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ReviewCard({
  authorName,
  rating,
  text,
  createdAt,
  featured,
}: ReviewCardProps) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: featured
          ? "1px solid #6366f1"
          : "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        padding: "24px",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#6366f1";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 8px 32px rgba(0, 0, 0, 0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = featured
          ? "#6366f1"
          : "rgba(255, 255, 255, 0.1)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {featured && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#6366f1",
            fontWeight: 500,
          }}
        >
          Doporuceno
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <StarRating rating={rating} size={18} />
      </div>

      <p
        style={{
          color: "rgba(255, 255, 255, 0.85)",
          fontSize: "15px",
          lineHeight: "1.6",
          margin: "0 0 16px 0",
        }}
      >
        {text}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {authorName}
        </span>
        <span
          style={{
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: "12px",
          }}
        >
          {formatDateCZ(createdAt)}
        </span>
      </div>
    </div>
  );
}
