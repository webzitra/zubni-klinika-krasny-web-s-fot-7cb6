"use client";

import { useState } from "react";
import StarRating from "./StarRating";

const PRIMARY = "#6366f1";

export default function ReviewForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Vyplnte prosim vase jmeno.");
      return;
    }
    if (rating === 0) {
      setError("Zvolte prosim hodnoceni (1-5 hvezdicek).");
      return;
    }
    if (text.trim().length < 10) {
      setError("Text recenze musi mit alespon 10 znaku.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: name.trim(),
          author_email: email.trim() || null,
          rating,
          text: text.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Neco se pokazilo.");
        return;
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setRating(0);
      setText("");
      onSuccess?.();
    } catch {
      setError("Nepodarilo se odeslat recenzi. Zkuste to prosim znovu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke={PRIMARY}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ margin: "0 auto 16px" }}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 500,
            color: "#fff",
            margin: "0 0 8px",
          }}
        >
          Dekujeme za vasi recenzi!
        </h3>
        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", margin: 0 }}>
          Po schvaleni se zobrazi na strance.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "8px",
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gap: "20px" }}>
        {/* Jmeno + Email */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <label style={labelStyle}>Jmeno *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vase jmeno"
              style={inputStyle}
              onFocus={(e) =>
                ((e.target as HTMLInputElement).style.borderColor = PRIMARY)
              }
              onBlur={(e) =>
                ((e.target as HTMLInputElement).style.borderColor =
                  "rgba(255, 255, 255, 0.12)")
              }
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.cz"
              style={inputStyle}
              onFocus={(e) =>
                ((e.target as HTMLInputElement).style.borderColor = PRIMARY)
              }
              onBlur={(e) =>
                ((e.target as HTMLInputElement).style.borderColor =
                  "rgba(255, 255, 255, 0.12)")
              }
            />
          </div>
        </div>

        {/* Hodnoceni */}
        <div>
          <label style={labelStyle}>Hodnoceni *</label>
          <StarRating
            rating={rating}
            size={32}
            interactive={true}
            onRate={setRating}
          />
        </div>

        {/* Text recenze */}
        <div>
          <label style={labelStyle}>Vase recenze *</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Podelte se o svou zkusenost..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical" as const,
              minHeight: "100px",
            }}
            onFocus={(e) =>
              ((e.target as HTMLTextAreaElement).style.borderColor = PRIMARY)
            }
            onBlur={(e) =>
              ((e.target as HTMLTextAreaElement).style.borderColor =
                "rgba(255, 255, 255, 0.12)")
            }
          />
        </div>

        {/* Chybova hlaska */}
        {error && (
          <p
            style={{
              color: "#ef4444",
              fontSize: "14px",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        {/* Tlacitko */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "14px 32px",
            backgroundColor: PRIMARY,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 20px ${PRIMARY}66`,
          }}
          onMouseEnter={(e) => {
            if (!submitting) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                `0 0 32px ${PRIMARY}99`;
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              `0 0 20px ${PRIMARY}66`;
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          {submitting ? "Odesilam..." : "Odeslat recenzi"}
        </button>
      </div>
    </form>
  );
}
