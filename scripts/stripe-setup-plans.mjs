/**
 * Creates Stripe products & prices for InfluexAI subscription plans.
 * Run: node --env-file=.env.local scripts/stripe-setup-plans.mjs
 *
 * Append printed env vars to .env.local
 */

const PLANS = [
  {
    id: "starter",
    name: "InfluExAi Starter",
    monthlyEur: 9.99,
    yearlyPerMonthEur: 9.99,
    monthlyEnv: "NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY",
    yearlyEnv: "NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_YEARLY",
  },
  {
    id: "creator",
    name: "InfluexAI Creator",
    monthlyEur: 49,
    yearlyPerMonthEur: 39,
    monthlyEnv: "NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY",
    yearlyEnv: "NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_YEARLY",
  },
  {
    id: "pro",
    name: "InfluexAI Pro",
    monthlyEur: 99,
    yearlyPerMonthEur: 79,
    monthlyEnv: "NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_MONTHLY",
    yearlyEnv: "NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_YEARLY",
  },
  {
    id: "business",
    name: "InfluexAI Business",
    monthlyEur: 199,
    yearlyPerMonthEur: 159,
    monthlyEnv: "NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_MONTHLY",
    yearlyEnv: "NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_YEARLY",
  },
];

const CREDIT_PACKS = [
  {
    id: "small",
    name: "InfluexAI Credits Small (25)",
    eur: 5,
    env: "STRIPE_CREDITS_25",
  },
  {
    id: "medium",
    name: "InfluexAI Credits Medium (70)",
    eur: 12,
    env: "STRIPE_CREDITS_150",
  },
  {
    id: "large",
    name: "InfluexAI Credits Large (160)",
    eur: 25,
    env: "STRIPE_CREDITS_350",
  },
  {
    id: "xl",
    name: "InfluexAI Credits XL (320)",
    eur: 45,
    env: "STRIPE_CREDITS_800",
  },
];

const EXTRA_CREDITS = {
  name: "InfluexAI Extra Credits (100)",
  eur: 12,
  env: "STRIPE_PRICE_EXTRA_CREDITS_100",
};

function eurToCents(eur) {
  return Math.round(eur * 100);
}

async function stripePost(path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY fehlt in .env.local");

  const body = new URLSearchParams(params);
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Stripe ${path} failed`);
  }
  return data;
}

async function findProductByName(name) {
  const key = process.env.STRIPE_SECRET_KEY;
  const res = await fetch(
    `https://api.stripe.com/v1/products?active=true&limit=100`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  const data = await res.json();
  return data.data?.find((p) => p.name === name) ?? null;
}

async function ensureProduct(name) {
  const existing = await findProductByName(name);
  if (existing) return existing.id;
  const product = await stripePost("products", {
    name,
    "metadata[platform]": "influexai",
  });
  return product.id;
}

async function createPrice(productId, unitAmount, interval) {
  const params = {
    product: productId,
    currency: "eur",
    unit_amount: String(unitAmount),
  };
  if (interval) {
    params["recurring[interval]"] = interval;
    params["recurring[interval_count]"] = "1";
  }
  const price = await stripePost("prices", params);
  return price.id;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key.startsWith("sk_test_")) {
    throw new Error(
      "STRIPE_SECRET_KEY must be sk_test_ (test mode only). Live keys are blocked."
    );
  }
  if (process.env.STRIPE_MODE?.trim().toLowerCase() === "live") {
    throw new Error("STRIPE_MODE=live is not allowed for this script.");
  }

  const envLines = [];

  for (const plan of PLANS) {
    const productId = await ensureProduct(plan.name);
    const monthlyId = await createPrice(
      productId,
      eurToCents(plan.monthlyEur),
      "month"
    );
    const yearlyId = await createPrice(
      productId,
      eurToCents(plan.yearlyPerMonthEur * 12),
      "year"
    );
    envLines.push(`${plan.monthlyEnv}=${monthlyId}`);
    envLines.push(`${plan.yearlyEnv}=${yearlyId}`);
    console.log(`✓ ${plan.name}: monthly ${monthlyId}, yearly ${yearlyId}`);
  }

  for (const pack of CREDIT_PACKS) {
    const productId = await ensureProduct(pack.name);
    const priceId = await createPrice(productId, eurToCents(pack.eur), null);
    envLines.push(`${pack.env}=${priceId}`);
    console.log(`✓ ${pack.name}: ${priceId}`);
  }

  const extraProductId = await ensureProduct(EXTRA_CREDITS.name);
  const extraId = await createPrice(
    extraProductId,
    eurToCents(EXTRA_CREDITS.eur),
    null
  );
  envLines.push(`${EXTRA_CREDITS.env}=${extraId}`);
  console.log(`✓ Extra Credits 100: ${extraId}`);

  console.log("\n# Add to .env.local:\n");
  console.log(envLines.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
