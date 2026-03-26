import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
);

console.log("URL:", env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Key length:", env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

console.log("\nTesting login with admin credentials...");
const { data, error } = await supabase.auth.signInWithPassword({
  email: "sitelysitely@gmail.com",
  password: "Gelagela4",
});

if (error) {
  console.error("LOGIN FAILED:", error.message);
  console.error("Error code:", error.code);
  console.error("Status:", error.status);
} else {
  console.log("LOGIN SUCCESS!");
  console.log("User ID:", data.user?.id);
  console.log("Email:", data.user?.email);
  console.log("Role:", data.user?.user_metadata?.role);
  console.log("Session exists:", !!data.session);
}
