import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://phjybvphmlzghdebonzy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanlidnBobWx6Z2hkZWJvbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI2MDIsImV4cCI6MjA4ODE2ODYwMn0.6r7C6aQPn0YTjmDjRkP8fVd6cQhXJ_L1jBYqsu2qRWM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
