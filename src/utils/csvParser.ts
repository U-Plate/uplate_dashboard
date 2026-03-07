import type { Food } from '../constants';

type FoodWithoutIds = Omit<Food, 'id' | 'restaurantId'>;

const COLUMN_MAP: Record<string, keyof FoodWithoutIds> = {
  'Food': 'name',
  'Serving Size': 'servingSize',
  'Calories': 'calories',
  'Fat': 'fat',
  'Saturated Fat': 'saturatedFat',
  'Cholesterol': 'cholesterol',
  'Sodium': 'sodium',
  'Carbs': 'carbs',
  'Dietery Fiber': 'dietaryFiber',
  'Dietary Fiber': 'dietaryFiber',
  'Sugar': 'sugar',
  'Protein': 'protein',
  'Added Sugars': 'addedSugars',
  'Calcium': 'calcium',
  'Iron': 'iron',
  'Labels': 'labels',
  'Ingredients': 'ingredients',
};

const NUMERIC_FIELDS = new Set<string>([
  'calories', 'fat', 'saturatedFat', 'cholesterol', 'sodium', 'carbs',
  'dietaryFiber', 'sugar', 'protein', 'addedSugars', 'calcium', 'iron',
  'caloriesFromFat', 'quantity',
]);

function parseNumeric(value: string): number {
  const stripped = value.replace(/[g|mg|kcal|%]/gi, '').trim();
  const num = parseFloat(stripped);
  return isNaN(num) ? 0 : num;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function parseCSV(csvText: string): FoodWithoutIds[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const foods: FoodWithoutIds[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const nameIndex = headers.findIndex((h) => h.trim() === 'Food');
    const name = nameIndex >= 0 ? values[nameIndex]?.trim() : '';
    if (!name) continue;

    const food: Record<string, unknown> = {
      name: '',
      quantity: 1,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sugar: 0,
      ingredients: '',
      servingSize: '',
      saturatedFat: 0,
      addedSugars: 0,
      sodium: 0,
      dietaryFiber: 0,
      cholesterol: 0,
      caloriesFromFat: 0,
      calcium: 0,
      iron: 0,
      labels: [],
    };

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].trim();
      const fieldName = COLUMN_MAP[header];
      if (!fieldName) continue;

      const raw = (values[j] ?? '').trim();

      if (fieldName === 'labels') {
        food.labels = raw
          ? raw.split(',').map((l: string) => l.trim()).filter(Boolean)
          : [];
      } else if (NUMERIC_FIELDS.has(fieldName)) {
        food[fieldName] = parseNumeric(raw);
      } else {
        food[fieldName] = raw;
      }
    }

    foods.push(food as unknown as FoodWithoutIds);
  }

  return foods;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
