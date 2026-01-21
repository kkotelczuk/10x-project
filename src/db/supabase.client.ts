import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const createSupabaseClient = (accessToken?: string) => {
  if (!accessToken) {
    return supabaseClient;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "5f53673d-626f-4f11-8638-b1e65407fdf7";
