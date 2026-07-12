import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabaseAnonKey } from "../env";
import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowser() {
  if (client) return client;
  client = createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
  return client;
}
