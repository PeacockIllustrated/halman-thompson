import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { uploadQuoteExports } from "@/lib/supabase/storage";
import { calculatePrice } from "@/lib/pricing/engine";
import { validateQuoteSubmission } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import type { PricingRequest } from "@/types";

export async function POST(req: NextRequest) {
  // Rate limit public submissions per client IP.
  const rl = rateLimit(`quote-submit:${clientKey(req)}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  // Parse — never let malformed JSON throw an unhandled error.
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate & normalise the core submission fields.
  const validated = validateQuoteSubmission(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const v = validated.value;

  // Recompute the price server-side — NEVER trust client-supplied pricing.
  const pricingRequest: PricingRequest = {
    productType: v.productType,
    finishId: v.finishId,
    width: v.width,
    height: v.height,
    thickness: v.thickness,
    mountingType: v.mountingType,
    panelCount: v.panelCount,
    ...(v.flatWidth !== undefined && v.flatHeight !== undefined
      ? { flatWidth: v.flatWidth, flatHeight: v.flatHeight }
      : {}),
  };
  const pricing = calculatePrice(pricingRequest);

  const supabase = getSupabaseAdmin();

  // Insert the quote row first (without file URLs — we need the ID).
  // Validated fields come from `v`; unvalidated passthrough fields come from
  // the raw body. The price is the SERVER-computed value, not the client's.
  const row = {
    customer_name: v.customerName,
    customer_email: v.customerEmail,
    customer_phone: (body.customerPhone as string | null | undefined) ?? null,
    is_trade: (body.isTrade as boolean | undefined) ?? false,
    company_name: (body.companyName as string | null | undefined) ?? null,
    product_type: v.productType,
    finish_id: v.finishId,
    finish_name: v.finishName,
    base_metal: (body.baseMetal as string | null | undefined) ?? null,
    width: v.width,
    height: v.height,
    thickness: v.thickness,
    mounting_type: v.mountingType,
    lacquer_type: (body.lacquerType as string | undefined) ?? "matte",
    panel_count: v.panelCount,
    calculated_price: pricing.totalPrice,
    price_breakdown: pricing.breakdown,
    configuration_url: (body.configurationUrl as string | null | undefined) ?? null,
    notes: (body.notes as string | null | undefined) ?? null,
    worktop_config: body.worktopConfig ?? null,
    signage_config: body.signageConfig ?? null,
    // Raw strings kept as fallback — URLs will be added after upload
    svg_workshop: (body.svgWorkshop as string | null | undefined) ?? null,
    svg_production: (body.svgProduction as string | null | undefined) ?? null,
    dxf_export: (body.dxfExport as string | null | undefined) ?? null,
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
        svgWorkshop: body.svgWorkshop as string | undefined,
        svgProduction: body.svgProduction as string | undefined,
        dxfExport: body.dxfExport as string | undefined,
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

  // Notify sales (best-effort — email failure must never fail the request).
  await notifySales(v.customerName, v.productType, pricing.totalPrice);

  return NextResponse.json({ ok: true, quoteId });
}

/**
 * Fire a quote-notification email via Resend if configured. Swallows all
 * errors — the quote is already persisted and the customer must not see a
 * failure because a notification bounced.
 */
async function notifySales(
  customerName: string,
  productType: string,
  price: number
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.HT_NOTIFICATION_EMAIL;
  if (!apiKey || !to) return;

  // Optional dedicated sender; falls back to the notification address itself.
  const from = process.env.HT_NOTIFICATION_FROM ?? to;
  const subject = `New quote request — ${customerName} — ${productType} — £${price.toFixed(2)}`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text:
          `A new quote request has been submitted.\n\n` +
          `Customer: ${customerName}\n` +
          `Product: ${productType}\n` +
          `Estimated total (server-computed): £${price.toFixed(2)}\n`,
      }),
    });
  } catch (mailErr) {
    console.error("[quote-submit] Sales notification failed:", mailErr);
  }
}
