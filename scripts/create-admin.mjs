import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Read .env manually
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase.auth.admin.createUser({
  email: "sitelysitely@gmail.com",
  password: "Gelagela4",
  email_confirm: true,
  user_metadata: { role: "super_admin", nick: "sitely" },
});

if (error) {
  console.error("Error creating admin:", error.message);
  process.exit(1);
}

console.log("Admin created successfully!");
console.log("User ID:", data.user.id);
console.log("Email:", data.user.email);
console.log("Role:", data.user.user_metadata?.role);
