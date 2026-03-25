"use client";

import { useState, useEffect, useCallback } from "react";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";

const PRIMARY = "#6366f1";
const BUSINESS = "zubní klinika, krásný web s fotkou v pozadí hero sekce, mode";

interface Review {
  id: string;
  author_name: string;
  author_email: string | null;
  rating: number;
  text: string;
  status: string;
  featured: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  average: number;
  distribution: { rating: number; count: number }[];
}

export default function RecenzePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch {
      console.error("Nepodarilo se nacist recenze.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f" }}>
      {/* Hlavicka */}
      <header
        style={{
          padding: "48px 16px 40px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 500,
            color: "#fff",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Recenze — {BUSINESS}
        </h1>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "15px",
            margin: 0,
          }}
        >
          Co o nas rikaji nasi zakaznici
        </p>
      </header>

      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "48px 16px 96px",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                borderTopColor: PRIMARY,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Statistiky */}
            {stats && stats.total > 0 && (
              <section
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "40px",
                  alignItems: "center",
                  marginBottom: "56px",
                  padding: "32px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* Prumerne hodnoceni */}
                <div style={{ textAlign: "center", minWidth: "120px" }}>
                  <div
                    style={{
                      fontSize: "56px",
                      fontWeight: 500,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {stats.average.toFixed(1)}
                  </div>
                  <div style={{ margin: "8px 0" }}>
                    <StarRating rating={stats.average} size={22} />
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.45)",
                    }}
                  >
                    {stats.total} {stats.total === 1 ? "recenze" : stats.total < 5 ? "recenze" : "recenzi"}
                  </div>
                </div>

                {/* Distribuce hodnoceni */}
                <div style={{ display: "grid", gap: "6px" }}>
                  {[...stats.distribution].reverse().map((d) => {
                    const pct = stats.total > 0 ? (d.count / stats.total) * 100 : 0;
                    return (
                      <div
                        key={d.rating}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "24px 1fr 36px",
                          gap: "10px",
                          alignItems: "center",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ color: "rgba(255, 255, 255, 0.5)", textAlign: "right" }}>
                          {d.rating}
                        </span>
                        <div
                          style={{
                            height: "6px",
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              backgroundColor: PRIMARY,
                              borderRadius: "3px",
                              transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          />
                        </div>
                        <span style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: "12px" }}>
                          {d.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Prazdny stav */}
            {reviews.length === 0 && !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 24px",
                  marginBottom: "48px",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ margin: "0 auto 16px" }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.4)",
                    fontSize: "15px",
                    margin: 0,
                  }}
                >
                  Zatim zde nejsou zadne recenze. Budete prvni!
                </p>
              </div>
            )}

            {/* Seznam recenzi */}
            {reviews.length > 0 && (
              <section
                style={{
                  display: "grid",
                  gap: "16px",
                  marginBottom: "64px",
                }}
              >
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    authorName={review.author_name}
                    rating={review.rating}
                    text={review.text}
                    createdAt={review.created_at}
                    featured={review.featured}
                  />
                ))}
              </section>
            )}

            {/* Formular pro novou recenzi */}
            <section>
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingTop: "48px",
                }}
              >
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "#fff",
                    margin: "0 0 8px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Napiste nam recenzi
                </h2>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.45)",
                    fontSize: "14px",
                    margin: "0 0 32px",
                  }}
                >
                  Vase zpetna vazba nam pomaha zlepsovat nase sluzby.
                </p>
                <ReviewForm onSuccess={loadReviews} />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
