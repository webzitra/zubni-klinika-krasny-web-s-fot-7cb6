"use client";

import { useState, useEffect, useCallback } from "react";

// Typy
interface Reservation {
  id: string;
  service: string | null;
  date: string;
  time_slot: string;
  client_name: string;
  client_email: string | null;
  client_phone: string;
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  duration_min: number;
  price: number | null;
  active: boolean;
}

const PRIMARY = "#6366f1";

// Formátování data
function formatDateCZ(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Dnešní datum jako string
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// Mapování statusů na český text a barvy
const STATUS_MAP: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  pending: { label: "Čeká", bg: "#fef3c7", color: "#92400e" },
  confirmed: { label: "Potvrzeno", bg: "#d1fae5", color: "#065f46" },
  cancelled: { label: "Zrušeno", bg: "#fee2e2", color: "#991b1b" },
};

export default function AdminReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Načtení rezervací pro vybraný den
  const loadReservations = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reservations?date=${date}&admin=true`
      );
      const data = await res.json();
      setReservations(data.reservations || []);
      setServices(data.services || []);
    } catch {
      console.error("Nepodařilo se načíst rezervace.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Načtení při změně data
  useEffect(() => {
    loadReservations(selectedDate);
  }, [selectedDate, loadReservations]);

  // Změna statusu rezervace
  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        // Aktualizace lokálního stavu
        setReservations((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: newStatus as Reservation["status"] }
              : r
          )
        );
      }
    } catch {
      console.error("Nepodařilo se aktualizovat status.");
    } finally {
      setUpdating(null);
    }
  };

  // Statistiky
  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
  };

  return (
    <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
      {/* Hlavička */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}
        >
          Rezervace
        </h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "2px solid #e5e7eb",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Datum */}
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        {formatDateCZ(selectedDate)}
      </p>

      {/* Statistiky */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        <StatCard label="Celkem" value={stats.total} color="#6b7280" />
        <StatCard label="Čekající" value={stats.pending} color="#d97706" />
        <StatCard label="Potvrzené" value={stats.confirmed} color="#059669" />
        <StatCard label="Zrušené" value={stats.cancelled} color="#dc2626" />
      </div>

      {/* Seznam rezervací */}
      {loading ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>
          Načítání...
        </p>
      ) : reservations.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            color: "#9ca3af",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>
            Žádné rezervace
          </p>
          <p style={{ fontSize: "14px" }}>
            Pro tento den nejsou evidovány žádné rezervace.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reservations.map((r) => {
            const statusInfo = STATUS_MAP[r.status] || STATUS_MAP.pending;
            const isUpdating = updating === r.id;

            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  border: "1px solid #f3f4f6",
                }}
              >
                {/* Horní řádek: čas, služba, status */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: PRIMARY,
                      }}
                    >
                      {r.time_slot}
                    </span>
                    {r.service && (
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          backgroundColor: "#f3f4f6",
                          padding: "2px 10px",
                          borderRadius: "12px",
                        }}
                      >
                        {r.service}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: "12px",
                      backgroundColor: statusInfo.bg,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Kontaktní údaje */}
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: "4px",
                    }}
                  >
                    {r.client_name}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    {r.client_phone}
                    {r.client_email && ` · ${r.client_email}`}
                  </div>
                  {r.notes && (
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#9ca3af",
                        marginTop: "4px",
                        fontStyle: "italic",
                      }}
                    >
                      {r.notes}
                    </div>
                  )}
                </div>

                {/* Akční tlačítka */}
                {r.status !== "cancelled" && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {r.status === "pending" && (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateStatus(r.id, "confirmed")}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: "#059669",
                          color: "#fff",
                          cursor: isUpdating ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          fontWeight: 500,
                          opacity: isUpdating ? 0.6 : 1,
                        }}
                      >
                        {isUpdating ? "..." : "Potvrdit"}
                      </button>
                    )}
                    {r.status === "confirmed" && (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateStatus(r.id, "pending")}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "6px",
                          border: "2px solid #e5e7eb",
                          backgroundColor: "#fff",
                          color: "#374151",
                          cursor: isUpdating ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          fontWeight: 500,
                          opacity: isUpdating ? 0.6 : 1,
                        }}
                      >
                        Vrátit na čekající
                      </button>
                    )}
                    <button
                      disabled={isUpdating}
                      onClick={() => updateStatus(r.id, "cancelled")}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "6px",
                        border: "2px solid #fecaca",
                        backgroundColor: "#fff",
                        color: "#dc2626",
                        cursor: isUpdating ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      Zrušit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Komponenta pro statistickou kartu
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "10px",
        padding: "16px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        border: "1px solid #f3f4f6",
      }}
    >
      <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
