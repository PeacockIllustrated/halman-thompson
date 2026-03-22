/**
 * Hand-written Supabase database types for the hal-tho_ prefixed tables.
 * Replace with auto-generated types via `pnpm db:generate` once schema is deployed.
 */

export type OrderStatus =
  | "quote_requested"
  | "reviewed"
  | "quoted"
  | "accepted"
  | "rejected"
  | "in_production"
  | "completed";

export interface QuoteRow {
  id: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  is_trade: boolean;
  company_name: string | null;
  product_type: string;
  finish_id: string;
  finish_name: string;
  width: number;
  height: number;
  thickness: number;
  mounting_type: string;
  lacquer_type: string;
  panel_count: number;
  calculated_price: number | null;
  price_breakdown: Record<string, unknown> | null;
  configuration_url: string | null;
  render_image_url: string | null;
  notes: string | null;
  internal_notes: string | null;
  worktop_config: Record<string, unknown> | null;
}

export interface PricingConfigRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
}

export interface ProductConfigRow {
  id: string;
  product_type: string;
  min_width: number;
  max_width: number;
  min_height: number;
  max_height: number;
  default_width: number;
  default_height: number;
  labour_multiplier: number;
  starting_price: number;
  is_active: boolean;
  updated_at: string;
}

export interface FinishConfigRow {
  id: string;
  finish_id: string;
  price_modifier: number;
  is_active: boolean;
  updated_at: string;
}

// Supabase-compatible Database type for createClient<Database>()
export interface Database {
  public: {
    Tables: {
      "hal-tho_quotes": {
        Row: QuoteRow;
        Insert: Omit<QuoteRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<QuoteRow, "id" | "created_at">>;
      };
      "hal-tho_pricing_config": {
        Row: PricingConfigRow;
        Insert: Omit<PricingConfigRow, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PricingConfigRow, "id">>;
      };
      "hal-tho_product_config": {
        Row: ProductConfigRow;
        Insert: Omit<ProductConfigRow, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProductConfigRow, "id">>;
      };
      "hal-tho_finish_config": {
        Row: FinishConfigRow;
        Insert: Omit<FinishConfigRow, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FinishConfigRow, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
