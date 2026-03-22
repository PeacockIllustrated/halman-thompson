import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { FinishConfigRow } from "@/lib/supabase/database.types";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("hal-tho_finish_config")
    .select("*")
    .order("finish_id")
    .returns<FinishConfigRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ finishes: data });
}

export async function PUT(req: NextRequest) {
  const { id, price_modifier, is_active } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("hal-tho_finish_config")
    .update({ price_modifier, is_active } as never)
    .eq("id", id as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
