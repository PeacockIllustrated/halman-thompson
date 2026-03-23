import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: quote, error } = await supabase
    .from("hal-tho_quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Fetch event history
  const { data: events } = await supabase
    .from("hal-tho_quote_events")
    .select("*")
    .eq("quote_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ quote, events: events ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const supabase = getSupabaseAdmin();

  // Fetch current quote for event logging
  const { data: currentRaw } = await supabase
    .from("hal-tho_quotes")
    .select("status, internal_notes")
    .eq("id", id)
    .single();

  const current = currentRaw as { status: string; internal_notes: string | null } | null;
  if (!current) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Build update payload — only allow specific fields
  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.internal_notes !== undefined) update.internal_notes = body.internal_notes;
  if (body.calculated_price !== undefined) update.calculated_price = body.calculated_price;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("hal-tho_quotes")
    .update(update as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log events
  const events: Array<{ quote_id: string; event_type: string; old_value: string | null; new_value: string | null }> = [];

  if (body.status !== undefined && body.status !== current.status) {
    events.push({
      quote_id: id,
      event_type: "status_change",
      old_value: current.status,
      new_value: body.status,
    });
  }

  if (body.internal_notes !== undefined && body.internal_notes !== current.internal_notes) {
    events.push({
      quote_id: id,
      event_type: "note_updated",
      old_value: null,
      new_value: body.internal_notes?.slice(0, 200) ?? null,
    });
  }

  if (events.length > 0) {
    await supabase.from("hal-tho_quote_events").insert(events as never[]);
  }

  return NextResponse.json({ ok: true });
}
