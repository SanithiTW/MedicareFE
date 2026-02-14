import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zbsflpvwhxdrsdsssslo.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_UxdoQDkzF__jAkzee0cNvg_QYWd-jDx";

// Create and export the client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);






