import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Basic validation
  const { customerName, customerEmail, productType, finishId, finishName, width, height, thickness } = body;
  if (!customerName || !customerEmail || !productType || !finishId || !width || !height) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const row = {
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: body.customerPhone ?? null,
    is_trade: body.isTrade ?? false,
    company_name: body.companyName ?? null,
    product_type: productType,
    finish_id: finishId,
    finish_name: finishName ?? finishId,
    width: Number(width),
    height: Number(height),
    thickness: Number(thickness ?? 0.9),
    mounting_type: body.mountingType ?? "none",
    lacquer_type: body.lacquerType ?? "matte",
    panel_count: body.panelCount ?? 1,
    calculated_price: body.calculatedPrice ?? null,
    price_breakdown: body.priceBreakdown ?? null,
    configuration_url: body.configurationUrl ?? null,
    notes: body.notes ?? null,
    worktop_config: body.worktopConfig ?? null,
  };

  const { data, error } = await supabase
    .from("hal-tho_quotes")
    .insert(row as never)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, quoteId: (data as { id: string })?.id });
}
