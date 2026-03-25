"use client";

import { useState, useEffect, useCallback } from "react";

// Typy
interface Service {
  id: string;
  name: string;
  duration_min: number;
  price: number | null;
}

interface FormData {
  service: string;
  date: string;
  time_slot: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  notes: string;
}

const PRIMARY = "#6366f1";
const BUSINESS = "zubní klinika, krásný web s fotkou v pozadí hero sekce, mode";

// Pomocná funkce pro formátování data do českého formátu
function formatDateCZ(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Minimální datum (dnes)
function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function ReservationPage() {
  // Aktuální krok: 1–5
  const [step, setStep] = useState(1);

  // Data formuláře
  const [form, setForm] = useState<FormData>({
    service: "",
    date: "",
    time_slot: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    notes: "",
  });

  // Načtená data z API
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsMessage, setSlotsMessage] = useState("");

  // Stav odesílání
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [reservationId, setReservationId] = useState("");

  // Načtení služeb při prvním renderování
  useEffect(() => {
    const today = getTodayString();
    fetch(`/api/reservations?date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.services) setServices(data.services);
      })
      .catch(() => {});
  }, []);

  // Načtení slotů při změně data
  const loadSlots = useCallback(async (date: string) => {
    if (!date) return;
    setLoading(true);
    setSlotsMessage("");
    setSlots([]);

    try {
      const res = await fetch(`/api/reservations?date=${date}`);
      const data = await res.json();

      if (data.message) {
        setSlotsMessage(data.message);
        setSlots([]);
      } else {
        setSlots(data.slots || []);
        if ((data.slots || []).length === 0) {
          setSlotsMessage("Na tento den nejsou volné termíny.");
        }
      }
    } catch {
      setSlotsMessage("Nepodařilo se načíst termíny.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Odeslání rezervace
  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Něco se pokazilo.");
        return;
      }

      setReservationId(data.reservationId);
      setSuccess(true);
      setStep(5);
    } catch {
      setError("Nepodařilo se odeslat rezervaci. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Aktualizace pole formuláře
  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Název vybrané služby
  const selectedServiceName =
    services.find((s) => s.name === form.service)?.name || form.service;

  // Indikátor kroků
  const stepLabels = ["Služba", "Datum", "Čas", "Kontakt", "Hotovo"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Hlavička */}
      <header
        style={{
          backgroundColor: PRIMARY,
          color: "#fff",
          padding: "24px 16px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          {BUSINESS}
        </h1>
        <p style={{ marginTop: "8px", opacity: 0.9, fontSize: "16px" }}>
          Online rezervace
        </p>
      </header>

      {/* Indikátor kroků */}
      {!success && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            padding: "24px 16px 0",
            flexWrap: "wrap",
          }}
        >
          {stepLabels.slice(0, 4).map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor: isActive
                      ? PRIMARY
                      : isDone
                      ? PRIMARY
                      : "#e5e7eb",
                    color: isActive || isDone ? "#fff" : "#6b7280",
                    transition: "all 0.2s",
                  }}
                >
                  {isDone ? "✓" : stepNum}
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    color: isActive ? PRIMARY : "#6b7280",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </span>
                {i < 3 && (
                  <div
                    style={{
                      width: "24px",
                      height: "2px",
                      backgroundColor: isDone ? PRIMARY : "#e5e7eb",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Obsah kroku */}
      <main
        style={{
          maxWidth: "560px",
          margin: "24px auto",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "32px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* KROK 1: Výběr služby */}
          {step === 1 && (
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: "#111827",
                }}
              >
                Vyberte službu
              </h2>

              {services.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  Načítání služeb...
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => {
                        updateField("service", svc.name);
                        setStep(2);
                      }}
                      style={{
                        padding: "16px",
                        borderRadius: "8px",
                        border:
                          form.service === svc.name
                            ? `2px solid ${PRIMARY}`
                            : "2px solid #e5e7eb",
                        backgroundColor:
                          form.service === svc.name ? `${PRIMARY}10` : "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        {svc.name}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          marginTop: "4px",
                          display: "flex",
                          gap: "12px",
                        }}
                      >
                        <span>{svc.duration_min} min</span>
                        {svc.price != null && <span>{svc.price} Kč</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KROK 2: Výběr data */}
          {step === 2 && (
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: "#111827",
                }}
              >
                Vyberte datum
              </h2>
              <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}>
                Služba: <strong>{selectedServiceName}</strong>
              </p>

              <input
                type="date"
                min={getTodayString()}
                value={form.date}
                onChange={(e) => {
                  updateField("date", e.target.value);
                  loadSlots(e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px solid #e5e7eb",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  ← Zpět
                </button>
                <button
                  disabled={!form.date}
                  onClick={() => setStep(3)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: form.date ? PRIMARY : "#d1d5db",
                    color: "#fff",
                    cursor: form.date ? "pointer" : "not-allowed",
                    fontWeight: 500,
                  }}
                >
                  Pokračovat →
                </button>
              </div>
            </div>
          )}

          {/* KROK 3: Výběr času */}
          {step === 3 && (
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: "#111827",
                }}
              >
                Vyberte čas
              </h2>
              <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}>
                {selectedServiceName} — {formatDateCZ(form.date)}
              </p>

              {loading ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "24px" }}>
                  Načítání volných termínů...
                </p>
              ) : slotsMessage ? (
                <p
                  style={{
                    color: "#ef4444",
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  {slotsMessage}
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                    gap: "8px",
                  }}
                >
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        updateField("time_slot", slot);
                        setStep(4);
                      }}
                      style={{
                        padding: "12px 8px",
                        borderRadius: "8px",
                        border:
                          form.time_slot === slot
                            ? `2px solid ${PRIMARY}`
                            : "2px solid #e5e7eb",
                        backgroundColor:
                          form.time_slot === slot ? `${PRIMARY}10` : "#fff",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "#111827",
                        transition: "all 0.15s",
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ marginTop: "24px" }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  ← Zpět
                </button>
              </div>
            </div>
          )}

          {/* KROK 4: Kontaktní údaje */}
          {step === 4 && (
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: "#111827",
                }}
              >
                Vaše údaje
              </h2>
              <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
                {selectedServiceName} — {formatDateCZ(form.date)} v {form.time_slot}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Jméno */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    Jméno a příjmení *
                  </label>
                  <input
                    type="text"
                    value={form.client_name}
                    onChange={(e) => updateField("client_name", e.target.value)}
                    placeholder="Jan Novák"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid #e5e7eb",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={form.client_phone}
                    onChange={(e) => updateField("client_phone", e.target.value)}
                    placeholder="+420 777 123 456"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid #e5e7eb",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.client_email}
                    onChange={(e) => updateField("client_email", e.target.value)}
                    placeholder="jan@email.cz"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid #e5e7eb",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Poznámka */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    Poznámka
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Máte zvláštní požadavky?"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid #e5e7eb",
                      fontSize: "16px",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              {error && (
                <p
                  style={{
                    color: "#ef4444",
                    marginTop: "12px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => setStep(3)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  ← Zpět
                </button>
                <button
                  disabled={!form.client_name || !form.client_phone || submitting}
                  onClick={handleSubmit}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor:
                      form.client_name && form.client_phone && !submitting
                        ? PRIMARY
                        : "#d1d5db",
                    color: "#fff",
                    cursor:
                      form.client_name && form.client_phone && !submitting
                        ? "pointer"
                        : "not-allowed",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  {submitting ? "Odesílání..." : "Rezervovat"}
                </button>
              </div>
            </div>
          )}

          {/* KROK 5: Potvrzení */}
          {step === 5 && success && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: `${PRIMARY}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "32px",
                }}
              >
                ✓
              </div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: "12px",
                }}
              >
                Rezervace odeslána!
              </h2>
              <p style={{ color: "#6b7280", marginBottom: "24px", lineHeight: 1.6 }}>
                Děkujeme za vaši rezervaci. Brzy vás budeme kontaktovat
                s potvrzením.
              </p>

              <div
                style={{
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "left",
                  marginBottom: "24px",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <strong>Služba:</strong> {selectedServiceName}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Datum:</strong> {formatDateCZ(form.date)}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Čas:</strong> {form.time_slot}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Jméno:</strong> {form.client_name}
                </div>
                <div>
                  <strong>Telefon:</strong> {form.client_phone}
                </div>
                {reservationId && (
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "#9ca3af" }}>
                    Číslo rezervace: {reservationId}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setForm({
                    service: "",
                    date: "",
                    time_slot: "",
                    client_name: "",
                    client_email: "",
                    client_phone: "",
                    notes: "",
                  });
                  setSuccess(false);
                  setStep(1);
                  setError("");
                }}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: PRIMARY,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                Nová rezervace
              </button>
            </div>
          )}
        </div>

        {/* Patička */}
        <p
          style={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "13px",
            marginTop: "24px",
            paddingBottom: "32px",
          }}
        >
          Vytvořeno pomocí WebZítra
        </p>
      </main>
    </div>
  );
}
