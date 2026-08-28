/**
 * CLI entrypoint — same logic as GET /api/admin/seed
 * Run: npm run seed
 */

import { createClient } from "@supabase/supabase-js";
import { runSeed } from "../lib/seedData";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const result = await runSeed(supabase);
  result.logs.forEach(({ message }) => console.log(message));

  if (!result.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
