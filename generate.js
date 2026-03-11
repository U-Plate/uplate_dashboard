import { readFileSync, writeFileSync } from "fs";

const MENU_FILE = "menu.json";
const OUTPUT_FILE = "jersey_mikes.tsv";
const API_BASE = "https://subs.jerseymikes.com/nutrition";
const CONCURRENCY = 5;
const DELAY_MS = 200;

const ALLERGEN_KEYS = [
  "egg",
  "fish",
  "milk",
  "peanut",
  "shellfish",
  "soy",
  "tree_nuts",
  "wheat",
  "sesame",
  "halal",
  "kosher",
];

const NUTRITION_MAP = {
  nutrition__total_calories__cal: "calories",
  nutrition__total_fat__g: "fat",
  nutrition__saturated_fat__g: "saturatedFat",
  nutrition__cholesterol__mg: "cholesterol",
  nutrition__sodium__mg: "sodium",
  nutrition__total_carbohydrate__g: "carbs",
  nutrition__dietary_fiber__g: "fiber",
  nutrition__sugars__g: "sugar",
  nutrition__protein__g: "protein",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Extract all unique (productId, sizeId, sizeName) tuples from menu.json
function extractProductSizes(menu) {
  const seen = new Set();
  const pairs = [];
  for (const category of menu) {
    for (const product of category.products) {
      for (const size of product.sizes) {
        const key = `${product.id}_${size.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({
            productId: product.id,
            sizeId: size.id,
            sizeName: size.name,
            productName: product.name,
          });
        }
      }
    }
  }
  return pairs;
}

// Fetch nutrition info for a single product/size combo
async function fetchNutrition(productId, sizeId) {
  const url = `${API_BASE}/${productId}/${sizeId}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed ${url}: ${res.status}`);
    return null;
  }
  return res.json();
}

// Extract ingredient rows from one API response
function extractIngredients(data, sizeName, productName) {
  if (!data || !data.product_ingredients) return [];
  return data.product_ingredients.map((ing) => {
    const nutrition = {};
    for (const [apiKey, localKey] of Object.entries(NUTRITION_MAP)) {
      nutrition[localKey] = parseFloat(ing[apiKey] || "0");
    }

    const labels = ALLERGEN_KEYS.filter(
      (k) => ing[`allergens__${k}`] === "1"
    );

    return {
      ingredientId: ing.ingredient_id || ing.id,
      name: (ing.name || "").trim(),
      sizeName,
      productName,
      nutrition,
      labels: labels.join(", "),
      ingredients: (ing.ingredients || "").replace(/\t/g, " ").replace(/\n/g, " "),
    };
  });
}

// Build a nutrition fingerprint string for deduplication
function nutritionKey(row) {
  return Object.values(row.nutrition)
    .map((v) => v.toFixed(6))
    .join("|");
}

async function main() {
  const menu = JSON.parse(readFileSync(MENU_FILE, "utf-8"));
  const productSizes = extractProductSizes(menu);
  console.log(`Found ${productSizes.length} product/size combos to fetch.`);

  // Fetch all nutrition data with batched concurrency
  const allIngredients = [];
  for (let i = 0; i < productSizes.length; i += CONCURRENCY) {
    const batch = productSizes.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(({ productId, sizeId, sizeName, productName }) =>
        fetchNutrition(productId, sizeId).then((data) => ({
          data,
          sizeName,
          productName,
        }))
      )
    );
    for (const { data, sizeName, productName } of results) {
      allIngredients.push(...extractIngredients(data, sizeName, productName));
    }
    const done = Math.min(i + CONCURRENCY, productSizes.length);
    console.log(`Fetched ${done}/${productSizes.length}`);
    if (i + CONCURRENCY < productSizes.length) await sleep(DELAY_MS);
  }

  console.log(`Extracted ${allIngredients.length} total ingredient rows.`);

  // Group by "{name} ({sizeName})"
  const groups = new Map();
  for (const row of allIngredients) {
    if (!row.name) continue;
    const key = `${row.name} (${row.sizeName})`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  // Deduplicate: within each group, keep unique nutrition fingerprints
  const finalRows = [];
  for (const [displayName, rows] of groups) {
    const uniqueByNutrition = new Map();
    for (const row of rows) {
      const nk = nutritionKey(row);
      if (!uniqueByNutrition.has(nk)) {
        uniqueByNutrition.set(nk, row);
      }
    }

    const uniqueRows = [...uniqueByNutrition.values()];

    if (uniqueRows.length === 1) {
      // Single unique nutrition — use plain name
      finalRows.push({ ...uniqueRows[0], food: displayName });
    } else {
      // Multiple different nutritions for same name+size — prepend full product name
      for (const row of uniqueRows) {
        finalRows.push({
          ...row,
          food: `${row.productName} ${displayName}`,
        });
      }
    }
  }

  console.log(`Final deduplicated rows: ${finalRows.length}`);

  // Format TSV
  const header = [
    "Food",
    "Serving Size",
    "Calories",
    "Fat",
    "Saturated Fat",
    "Cholesterol",
    "Sodium",
    "Carbs",
    "Dietery Fiber",
    "Sugar",
    "Protein",
    "Labels",
    "Ingredients",
  ].join("\t");

  const lines = finalRows.map((row) =>
    [
      row.food,
      row.sizeName,
      round(row.nutrition.calories),
      round(row.nutrition.fat),
      round(row.nutrition.saturatedFat),
      round(row.nutrition.cholesterol),
      round(row.nutrition.sodium),
      round(row.nutrition.carbs),
      round(row.nutrition.fiber),
      round(row.nutrition.sugar),
      round(row.nutrition.protein),
      row.labels,
      row.ingredients,
    ].join("\t")
  );

  const tsv = [header, ...lines].join("\n") + "\n";
  writeFileSync(OUTPUT_FILE, tsv, "utf-8");
  console.log(`Wrote ${finalRows.length} rows to ${OUTPUT_FILE}`);
}

function round(val) {
  return parseFloat(val.toFixed(2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
