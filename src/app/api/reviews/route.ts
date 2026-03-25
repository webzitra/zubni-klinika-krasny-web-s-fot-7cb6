import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PROJECT_ID = "7cb68039-7453-4937-916f-0c9917c9b653";

/**
 * GET /api/reviews
 * Query params:
 *   - admin (true) — volitelný, vrátí všechny recenze včetně pending/rejected
 *   - featured (true) — volitelný, vrátí jen zvýrazněné recenze
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get("admin") === "true";
  const featuredOnly = searchParams.get("featured") === "true";

  try {
    let query = supabase
      .from("reviews")
      .select("*")
      .eq("project_id", PROJECT_ID)
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("status", "approved");
    }

    if (featuredOnly) {
      query = query.eq("featured", true);
    }

    const { data: reviews, error } = await query;

    if (error) throw error;

    // Spočítání průměru a počtu
    const approved = (reviews || []).filter((r) => r.status === "approved");
    const totalRating = approved.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = approved.length > 0 ? totalRating / approved.length : 0;

    return NextResponse.json({
      reviews: reviews || [],
      stats: {
        total: approved.length,
        average: Math.round(averageRating * 10) / 10,
        distribution: [1, 2, 3, 4, 5].map((star) => ({
          rating: star,
          count: approved.filter((r) => r.rating === star).length,
        })),
      },
    });
  } catch (err) {
    console.error("Chyba při načítání recenzí:", err);
    return NextResponse.json(
      { error: "Nepodařilo se načíst recenze." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Vytvoří novou recenzi (status: pending).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { author_name, author_email, rating, text } = body;

    // Validace povinných polí
    if (!author_name || !rating || !text) {
      return NextResponse.json(
        { error: "Vyplňte prosím jméno, hodnocení a text recenze." },
        { status: 400 }
      );
    }

    // Validace hodnocení
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Hodnocení musí být mezi 1 a 5." },
        { status: 400 }
      );
    }

    // Validace délky textu
    if (text.length < 10) {
      return NextResponse.json(
        { error: "Text recenze musí mít alespoň 10 znaků." },
        { status: 400 }
      );
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        project_id: PROJECT_ID,
        author_name: author_name.trim(),
        author_email: author_email?.trim() || null,
        rating: ratingNum,
        text: text.trim(),
        status: "pending",
        source: "form",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      message: "Děkujeme za vaši recenzi! Po schválení se zobrazí na stránce.",
    });
  } catch (err) {
    console.error("Chyba při vytváření recenze:", err);
    return NextResponse.json(
      { error: "Nepodařilo se odeslat recenzi." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reviews — aktualizace statusu / featured
 * Používáno z admin rozhraní.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, featured } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Chybí ID recenze." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(status)) {
        return NextResponse.json(
          { error: "Neplatný status. Povolené: pending, approved, rejected." },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (featured !== undefined) {
      updates.featured = Boolean(featured);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Žádné změny k provedení." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .eq("project_id", PROJECT_ID);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Chyba při aktualizaci recenze:", err);
    return NextResponse.json(
      { error: "Nepodařilo se aktualizovat recenzi." },
      { status: 500 }
    );
  }
}
