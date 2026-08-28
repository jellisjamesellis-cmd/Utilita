/**
 * Idempotent seed script for mock tradespeople and historical jobs.
 * Run: npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in env.
 */

import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";
import {
  BASE_PRICES,
  LONDON_BOUNDS,
  TRADE_TYPES,
  TradeType,
} from "../lib/types";
import { calculatePrice } from "../lib/pricing";

const MOCK_TRADESPERSON_TARGET = 2000;
const MOCK_JOB_TARGET = 500;
const MOCK_CUSTOMER_COUNT = 40;
const BATCH_SIZE = 100;

const LONDON_AREAS = [
  { name: "Camden", lat: 51.539, lng: -0.1426 },
  { name: "Hackney", lat: 51.545, lng: -0.055 },
  { name: "Islington", lat: 51.536, lng: -0.103 },
  { name: "Westminster", lat: 51.4975, lng: -0.1357 },
  { name: "Greenwich", lat: 51.482, lng: 0.005 },
  { name: "Croydon", lat: 51.372, lng: -0.1 },
  { name: "Ealing", lat: 51.513, lng: -0.308 },
  { name: "Wimbledon", lat: 51.421, lng: -0.206 },
  { name: "Brixton", lat: 51.461, lng: -0.115 },
  { name: "Stratford", lat: 51.543, lng: -0.002 },
  { name: "Richmond", lat: 51.461, lng: -0.303 },
  { name: "Harrow", lat: 51.589, lng: -0.334 },
];

const JOB_DESCRIPTIONS: Record<TradeType, string[]> = {
  painter: [
    "Paint living room walls and ceiling",
    "Touch up scuffed hallway paintwork",
    "Exterior window frame repainting",
    "Feature wall in master bedroom",
  ],
  plumber: [
    "Fix leaking kitchen tap",
    "Unblock bathroom drain",
    "Install new shower mixer",
    "Radiator not heating — needs bleed",
  ],
  mover: [
    "Move sofa and wardrobe to new flat",
    "Help load van for house move",
    "Deliver furniture from IKEA",
    "Clear garage and dispose of items",
  ],
  handyman: [
    "Mount TV on wall and hide cables",
    "Assemble flat-pack wardrobe",
    "Fix sticking front door",
    "Install curtain rails in two rooms",
  ],
  cleaner: [
    "Deep clean before tenancy end",
    "Weekly home clean — 3 bed house",
    "One-off oven and bathroom clean",
    "Post-renovation dust removal",
  ],
};

function randomLondonCoords(): { lat: number; lng: number; area: string } {
  const area = faker.helpers.arrayElement(LONDON_AREAS);
  const lat =
    area.lat +
    faker.number.float({ min: -0.04, max: 0.04, fractionDigits: 6 });
  const lng =
    area.lng +
    faker.number.float({ min: -0.04, max: 0.04, fractionDigits: 6 });
  const clampedLat = Math.min(
    LONDON_BOUNDS.latMax,
    Math.max(LONDON_BOUNDS.latMin, lat)
  );
  const clampedLng = Math.min(
    LONDON_BOUNDS.lngMax,
    Math.max(LONDON_BOUNDS.lngMin, lng)
  );
  return { lat: clampedLat, lng: clampedLng, area: area.name };
}

function weightedRating(): number {
  const roll = faker.number.float({ min: 0, max: 1 });
  if (roll < 0.65) {
    return faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 });
  }
  if (roll < 0.9) {
    return faker.number.float({ min: 3.5, max: 4.0, fractionDigits: 1 });
  }
  return faker.number.float({ min: 3.0, max: 3.5, fractionDigits: 1 });
}

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

  faker.seed(42);

  const { count: existingTpCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_mock", true)
    .eq("role", "tradesperson");

  if ((existingTpCount ?? 0) >= MOCK_TRADESPERSON_TARGET) {
    console.log(
      `Mock tradespeople already seeded (${existingTpCount}). Skipping user seed.`
    );
  } else {
    console.log(`Seeding ${MOCK_TRADESPERSON_TARGET} mock tradespeople…`);
    const perTrade = Math.floor(MOCK_TRADESPERSON_TARGET / TRADE_TYPES.length);

    for (let batchStart = 0; batchStart < MOCK_TRADESPERSON_TARGET; batchStart += BATCH_SIZE) {
      const users: Record<string, unknown>[] = [];
      const availability: Record<string, unknown>[] = [];

      for (
        let i = batchStart;
        i < Math.min(batchStart + BATCH_SIZE, MOCK_TRADESPERSON_TARGET);
        i++
      ) {
        const tradeType = TRADE_TYPES[i % TRADE_TYPES.length];
        const id = `mock_tp_${String(i + 1).padStart(5, "0")}`;
        const coords = randomLondonCoords();
        const isAvailable = faker.number.float({ min: 0, max: 1 }) < 0.15;

        users.push({
          id,
          email: `${id}@mock.utilita.local`,
          role: "tradesperson",
          trade_type: tradeType,
          display_name: faker.person.fullName(),
          rating: weightedRating(),
          completed_jobs_count: faker.number.int({ min: 3, max: 420 }),
          is_mock: true,
        });

        availability.push({
          tradesperson_id: id,
          is_available: isAvailable,
          current_lat: coords.lat,
          current_lng: coords.lng,
        });
      }

      const { error: userError } = await supabase.from("users").upsert(users, {
        onConflict: "id",
      });
      if (userError) {
        console.error("User batch failed:", userError.message);
        process.exit(1);
      }

      const { error: availError } = await supabase
        .from("availability")
        .upsert(availability, { onConflict: "tradesperson_id" });
      if (availError) {
        console.error("Availability batch failed:", availError.message);
        process.exit(1);
      }

      console.log(
        `  … ${Math.min(batchStart + BATCH_SIZE, MOCK_TRADESPERSON_TARGET)} / ${MOCK_TRADESPERSON_TARGET}`
      );
    }
  }

  const { count: existingJobCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .like("customer_id", "mock_cust_%");

  if ((existingJobCount ?? 0) >= MOCK_JOB_TARGET) {
    console.log(
      `Mock jobs already seeded (${existingJobCount}). Skipping job seed.`
    );
    console.log("Seed complete (idempotent — no duplicates).");
    return;
  }

  console.log("Seeding mock customers…");
  const customers: Record<string, unknown>[] = [];
  for (let c = 0; c < MOCK_CUSTOMER_COUNT; c++) {
    const id = `mock_cust_${String(c + 1).padStart(3, "0")}`;
    customers.push({
      id,
      email: `${id}@mock.utilita.local`,
      role: "customer",
      trade_type: null,
      display_name: faker.person.fullName(),
      is_mock: true,
    });
  }
  await supabase.from("users").upsert(customers, { onConflict: "id" });

  console.log(`Seeding ${MOCK_JOB_TARGET} historical jobs…`);
  const { data: mockTradespeople } = await supabase
    .from("users")
    .select("id, trade_type")
    .eq("is_mock", true)
    .eq("role", "tradesperson");

  const tpList = mockTradespeople ?? [];

  for (let batchStart = 0; batchStart < MOCK_JOB_TARGET; batchStart += BATCH_SIZE) {
    const jobs: Record<string, unknown>[] = [];

    for (
      let j = batchStart;
      j < Math.min(batchStart + BATCH_SIZE, MOCK_JOB_TARGET);
      j++
    ) {
      const customer = faker.helpers.arrayElement(customers);
      const tradeType = faker.helpers.arrayElement(TRADE_TYPES) as TradeType;
      const coords = randomLondonCoords();
      const basePrice = BASE_PRICES[tradeType];
      const surge = faker.helpers.arrayElement([1, 1, 1, 1.2, 1.4, 1.6]);
      const isCompleted = faker.number.float({ min: 0, max: 1 }) < 0.82;
      const status = isCompleted ? "completed" : "cancelled";
      const daysAgo = faker.number.int({ min: 0, max: 29 });
      const createdAt = new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000
      ).toISOString();

      const matchingTp = tpList.filter((t) => t.trade_type === tradeType);
      const tradesperson =
        isCompleted && matchingTp.length > 0
          ? faker.helpers.arrayElement(matchingTp)
          : null;

      jobs.push({
        id: faker.string.uuid(),
        customer_id: customer.id as string,
        tradesperson_id: tradesperson?.id ?? null,
        trade_type: tradeType,
        description: faker.helpers.arrayElement(JOB_DESCRIPTIONS[tradeType]),
        lat: coords.lat,
        lng: coords.lng,
        status,
        base_price: basePrice,
        price: calculatePrice(basePrice, surge),
        surge_multiplier: surge,
        service_tier: faker.helpers.arrayElement([
          "priority",
          "within_12h",
          "within_3d",
        ]),
        rating: isCompleted
          ? faker.number.int({ min: 3, max: 5 })
          : null,
        created_at: createdAt,
        updated_at: createdAt,
      });
    }

    const { error: jobError } = await supabase.from("jobs").insert(jobs);
    if (jobError) {
      console.error("Job batch failed:", jobError.message);
      process.exit(1);
    }

    console.log(
      `  … ${Math.min(batchStart + BATCH_SIZE, MOCK_JOB_TARGET)} / ${MOCK_JOB_TARGET} jobs`
    );
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
