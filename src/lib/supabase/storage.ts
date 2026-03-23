import { getSupabaseAdmin } from "./server";

const BUCKET = "quote-exports";

/**
 * Ensure the `quote-exports` storage bucket exists (idempotent).
 * Called once per cold-start at most.
 */
let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      allowedMimeTypes: ["image/svg+xml", "application/dxf", "application/octet-stream"],
    });
  }
  bucketReady = true;
}

/**
 * Upload a fabrication export file to Supabase Storage.
 *
 * @param quoteId  The quote UUID — used as the folder name
 * @param fileName e.g. "workshop.svg", "production.svg", "cutfile.dxf"
 * @param content  Raw file content (SVG string or DXF string)
 * @param mime     MIME type for the upload
 * @returns        The public URL of the uploaded file, or null on failure
 */
export async function uploadQuoteFile(
  quoteId: string,
  fileName: string,
  content: string,
  mime: string
): Promise<string | null> {
  try {
    await ensureBucket();
    const supabase = getSupabaseAdmin();
    const path = `${quoteId}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, content, {
        contentType: mime,
        upsert: true, // overwrite if re-submitted
      });

    if (error) {
      console.error(`[storage] upload failed for ${path}:`, error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.error("[storage] unexpected error:", err);
    return null;
  }
}

/**
 * Upload all fabrication exports for a quote in parallel.
 * Returns an object with the public URLs (null for any that failed/weren't provided).
 */
export async function uploadQuoteExports(
  quoteId: string,
  exports: {
    svgWorkshop?: string;
    svgProduction?: string;
    dxfExport?: string;
  }
): Promise<{
  svgWorkshopUrl: string | null;
  svgProductionUrl: string | null;
  dxfExportUrl: string | null;
}> {
  const [svgWorkshopUrl, svgProductionUrl, dxfExportUrl] = await Promise.all([
    exports.svgWorkshop
      ? uploadQuoteFile(quoteId, "workshop.svg", exports.svgWorkshop, "image/svg+xml")
      : Promise.resolve(null),
    exports.svgProduction
      ? uploadQuoteFile(quoteId, "production.svg", exports.svgProduction, "image/svg+xml")
      : Promise.resolve(null),
    exports.dxfExport
      ? uploadQuoteFile(quoteId, "cutfile.dxf", exports.dxfExport, "application/dxf")
      : Promise.resolve(null),
  ]);

  return { svgWorkshopUrl, svgProductionUrl, dxfExportUrl };
}
