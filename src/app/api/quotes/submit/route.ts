import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { uploadQuoteExports } from "@/lib/supabase/storage";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Basic validation
  const { customerName, customerEmail, productType, finishId, finishName, width, height, thickness } = body;
  if (!customerName || !customerEmail || !productType || !finishId || !width || !height) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Insert the quote row first (without file URLs — we need the ID)
  const row = {
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: body.customerPhone ?? null,
    is_trade: body.isTrade ?? false,
    company_name: body.companyName ?? null,
    product_type: productType,
    finish_id: finishId,
    finish_name: finishName ?? finishId,
    base_metal: body.baseMetal ?? null,
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
    signage_config: body.signageConfig ?? null,
    // Raw strings kept as fallback — URLs will be added after upload
    svg_workshop: body.svgWorkshop ?? null,
    svg_production: body.svgProduction ?? null,
    dxf_export: body.dxfExport ?? null,
    configuration_snapshot: body.configurationSnapshot ?? null,
    flat_sheet: body.flatSheet ?? null,
    panel_layout: body.panelLayout ?? null,
    device_info: body.deviceInfo ?? null,
  };

  const { data, error } = await supabase
    .from("hal-tho_quotes")
    .insert(row as never)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const quoteId = (data as { id: string })?.id;

  // Upload fabrication exports to Supabase Storage (non-blocking — quote is already saved)
  if (body.svgWorkshop || body.svgProduction || body.dxfExport) {
    try {
      const urls = await uploadQuoteExports(quoteId, {
        svgWorkshop: body.svgWorkshop,
        svgProduction: body.svgProduction,
        dxfExport: body.dxfExport,
      });

      // Update the quote row with storage URLs and clear raw strings to save DB space
      const urlUpdate: Record<string, unknown> = {};
      if (urls.svgWorkshopUrl) {
        urlUpdate.svg_workshop_url = urls.svgWorkshopUrl;
        urlUpdate.svg_workshop = null; // clear raw string — it's in storage now
      }
      if (urls.svgProductionUrl) {
        urlUpdate.svg_production_url = urls.svgProductionUrl;
        urlUpdate.svg_production = null;
      }
      if (urls.dxfExportUrl) {
        urlUpdate.dxf_export_url = urls.dxfExportUrl;
        urlUpdate.dxf_export = null;
      }

      if (Object.keys(urlUpdate).length > 0) {
        await supabase
          .from("hal-tho_quotes")
          .update(urlUpdate as never)
          .eq("id", quoteId);
      }
    } catch (uploadErr) {
      // File upload failed — raw strings are still in the DB as fallback
      console.error("[quote-submit] File upload failed, raw strings retained:", uploadErr);
    }
  }

  return NextResponse.json({ ok: true, quoteId });
}
