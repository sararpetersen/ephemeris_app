import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bbmabdbbjpfqoapbtstm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWFiZGJianBmcW9hcGJ0c3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NjkwNDYsImV4cCI6MjA1ODA0NTA0Nn0.gFnw6GZiMFOCMwy6rAcQFzoK0_qUJCwKNpl-XGzy574";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
