import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const recipeId = request.nextUrl.searchParams.get("recipe_id");
  if (!recipeId) {
    return NextResponse.json({ error: "Falta recipe_id" }, { status: 400 });
  }
  if (!isSupabaseConfigured) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase no configurado. Añade las variables de entorno." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { recipe_id, author_name, rating, comment } = body;

  if (!recipe_id || !author_name || !rating) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating debe ser entre 1 y 5" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert([{ recipe_id, author_name: author_name.trim(), rating, comment: comment?.trim() || null }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
