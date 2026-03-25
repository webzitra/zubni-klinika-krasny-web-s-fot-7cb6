import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PROJECT_ID = "7cb68039-7453-4937-916f-0c9917c9b653";

// Názvy dnů pro porovnání s open_days
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * GET /api/reservations
 * Query params:
 *   - date (YYYY-MM-DD) — povinný
 *   - admin (true) — volitelný, vrátí všechny rezervace pro daný den
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const isAdmin = searchParams.get("admin") === "true";

  if (!dateStr) {
    return NextResponse.json(
      { error: "Chybí parametr date (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  // Validace formátu data
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: "Neplatný formát data. Použijte YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    // Admin režim — vrátí všechny rezervace pro daný den
    if (isAdmin) {
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("project_id", PROJECT_ID)
        .eq("date", dateStr)
        .order("time_slot", { ascending: true });

      if (error) throw error;

      // Načtení služeb pro zobrazení
      const { data: services } = await supabase
        .from("reservation_services")
        .select("*")
        .eq("project_id", PROJECT_ID)
        .eq("active", true)
        .order("name", { ascending: true });

      return NextResponse.json({ reservations, services });
    }

    // Veřejný režim — vrátí volné sloty
    // 1. Načtení nastavení
    const { data: settings } = await supabase
      .from("reservation_settings")
      .select("*")
      .eq("project_id", PROJECT_ID)
      .single();

    const config = settings || {
      open_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      open_from: "09:00",
      open_to: "17:00",
      slot_duration_min: 60,
    };

    // 2. Kontrola, zda je den otevřený
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayName = DAY_NAMES[dateObj.getDay()];
    if (!config.open_days.includes(dayName)) {
      return NextResponse.json({
        slots: [],
        message: "V tento den nepřijímáme rezervace.",
      });
    }

    // 3. Generování všech slotů
    const allSlots = generateTimeSlots(
      config.open_from,
      config.open_to,
      config.slot_duration_min
    );

    // 4. Načtení existujících rezervací (jen potvrzené a čekající)
    const { data: existing } = await supabase
      .from("reservations")
      .select("time_slot")
      .eq("project_id", PROJECT_ID)
      .eq("date", dateStr)
      .in("status", ["pending", "confirmed"]);

    const bookedSlots = new Set((existing || []).map((r) => r.time_slot));

    // 5. Filtrování volných slotů
    const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

    // 6. Načtení aktivních služeb
    const { data: services } = await supabase
      .from("reservation_services")
      .select("id, name, duration_min, price")
      .eq("project_id", PROJECT_ID)
      .eq("active", true)
      .order("name", { ascending: true });

    return NextResponse.json({
      slots: availableSlots,
      services: services || [],
    });
  } catch (err) {
    console.error("Chyba při načítání rezervací:", err);
    return NextResponse.json(
      { error: "Nepodařilo se načíst data." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations
 * Vytvoří novou rezervaci.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { service, date, time_slot, client_name, client_email, client_phone, notes } = body;

    // Validace povinných polí
    if (!date || !time_slot || !client_name || !client_phone) {
      return NextResponse.json(
        {
          error: "Vyplňte prosím všechna povinná pole: datum, čas, jméno a telefon.",
        },
        { status: 400 }
      );
    }

    // Kontrola, zda slot není už obsazený
    const { data: conflict } = await supabase
      .from("reservations")
      .select("id")
      .eq("project_id", PROJECT_ID)
      .eq("date", date)
      .eq("time_slot", time_slot)
      .in("status", ["pending", "confirmed"])
      .limit(1);

    if (conflict && conflict.length > 0) {
      return NextResponse.json(
        { error: "Tento termín je bohužel již obsazený. Zvolte prosím jiný." },
        { status: 409 }
      );
    }

    // Vložení rezervace
    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        project_id: PROJECT_ID,
        service: service || null,
        date,
        time_slot,
        client_name,
        client_email: client_email || null,
        client_phone,
        notes: notes || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      message: "Rezervace byla úspěšně vytvořena. Brzy vás budeme kontaktovat.",
    });
  } catch (err) {
    console.error("Chyba při vytváření rezervace:", err);
    return NextResponse.json(
      { error: "Nepodařilo se vytvořit rezervaci." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reservations — aktualizace statusu
 * Používáno z admin rozhraní.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Chybí ID rezervace nebo nový status." },
        { status: 400 }
      );
    }

    if (!["confirmed", "cancelled", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Neplatný status. Povolené: pending, confirmed, cancelled." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id)
      .eq("project_id", PROJECT_ID);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Chyba při aktualizaci rezervace:", err);
    return NextResponse.json(
      { error: "Nepodařilo se aktualizovat rezervaci." },
      { status: 500 }
    );
  }
}

/**
 * Generuje časové sloty mezi open_from a open_to.
 */
function generateTimeSlots(
  openFrom: string,
  openTo: string,
  durationMin: number
): string[] {
  const slots: string[] = [];
  const [fromH, fromM] = openFrom.split(":").map(Number);
  const [toH, toM] = openTo.split(":").map(Number);

  let currentMin = fromH * 60 + fromM;
  const endMin = toH * 60 + toM;

  while (currentMin + durationMin <= endMin) {
    const h = Math.floor(currentMin / 60);
    const m = currentMin % 60;
    slots.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    );
    currentMin += durationMin;
  }

  return slots;
}
