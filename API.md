# UPlate Dashboard — API Reference

## Configuration

In `src/config.ts`, toggle between localStorage and API mode:

```ts
export const USE_API = false;               // true = REST API, false = localStorage
export const API_BASE_URL = 'http://localhost:3000/api';
```

When `USE_API` is `false` (default), data is stored in the browser's localStorage with sample data seeded automatically. When `true`, all CRUD operations go through the REST endpoints below.

---

## Conventions

| Convention        | Value                              |
| ----------------- | ---------------------------------- |
| Base URL          | `http://localhost:3000/api`        |
| Content-Type      | `application/json`                 |
| ID format         | Server-generated string            |
| Success responses | `200` (data), `201` (created), `204` (deleted) |
| Error responses   | `400` (bad request), `404` (not found), `500` (server error) |

---

## Sections

### `GET /api/sections`

List all sections.

**Response** `200`
```json
[
  { "id": "section-1", "name": "North Campus" }
]
```

### `GET /api/sections/:id`

Get a single section by ID.

**Response** `200`
```json
{ "id": "section-1", "name": "North Campus" }
```

### `POST /api/sections`

Create a new section.

**Body**
```json
{ "name": "East Campus" }
```

**Response** `201`
```json
{ "id": "section-4", "name": "East Campus" }
```

### `PUT /api/sections/:id`

Update a section.

**Body**
```json
{ "name": "Updated Name" }
```

**Response** `200`
```json
{ "id": "section-1", "name": "Updated Name" }
```

### `DELETE /api/sections/:id`

Delete a section.

**Response** `204` No Content

---

## Restaurants

### `GET /api/restaurants`

List all restaurants. Supports optional query filter.

| Query Param  | Description                     |
| ------------ | ------------------------------- |
| `sectionId`  | Filter by section               |

**Example** `GET /api/restaurants?sectionId=section-1`

**Response** `200`
```json
[
  {
    "id": "restaurant-1",
    "name": "Campus Café",
    "sectionId": "section-1",
    "location": { "longitude": -122.4194, "latitude": 37.7749 }
  }
]
```

### `GET /api/restaurants/:id`

Get a single restaurant by ID.

**Response** `200`
```json
{
  "id": "restaurant-1",
  "name": "Campus Café",
  "sectionId": "section-1",
  "location": { "longitude": -122.4194, "latitude": 37.7749 }
}
```

### `POST /api/restaurants`

Create a new restaurant.

**Body**
```json
{
  "name": "New Place",
  "sectionId": "section-1",
  "location": { "longitude": -122.42, "latitude": 37.78 }
}
```

**Response** `201`
```json
{
  "id": "restaurant-6",
  "name": "New Place",
  "sectionId": "section-1",
  "location": { "longitude": -122.42, "latitude": 37.78 }
}
```

### `PUT /api/restaurants/:id`

Update a restaurant.

**Body** (partial — any fields)
```json
{ "name": "Renamed Place" }
```

**Response** `200` — full updated restaurant object

### `PATCH /api/restaurants/:id/move`

Move a restaurant to a different section.

**Body**
```json
{ "sectionId": "section-2" }
```

**Response** `200` — full updated restaurant object

### `DELETE /api/restaurants/:id`

Delete a restaurant.

**Response** `204` No Content

---

## Foods

### `GET /api/foods`

List all food items. Supports optional query filter.

| Query Param    | Description                     |
| -------------- | ------------------------------- |
| `restaurantId` | Filter by restaurant            |

**Example** `GET /api/foods?restaurantId=restaurant-1`

**Response** `200`
```json
[
  {
    "id": "food-1",
    "name": "Caesar Salad",
    "restaurantId": "restaurant-1",
    "quantity": 1,
    "servingSize": "300g",
    "calories": 400,
    "caloriesFromFat": 180,
    "protein": 12,
    "carbs": 25,
    "fat": 20,
    "saturatedFat": 6,
    "sugar": 3,
    "addedSugars": 1,
    "sodium": 600,
    "dietaryFiber": 4,
    "cholesterol": 40,
    "calcium": 150,
    "iron": 2,
    "ingredients": "Romaine lettuce, Caesar dressing, croutons, parmesan cheese"
  }
]
```

### `GET /api/foods/:id`

Get a single food item by ID.

**Response** `200` — food object (same shape as above)

### `POST /api/foods`

Create a new food item.

**Body**
```json
{
  "name": "Turkey Wrap",
  "restaurantId": "restaurant-1",
  "quantity": 1,
  "servingSize": "250g",
  "calories": 350,
  "caloriesFromFat": 100,
  "protein": 28,
  "carbs": 30,
  "fat": 12,
  "saturatedFat": 3,
  "sugar": 4,
  "addedSugars": 1,
  "sodium": 500,
  "dietaryFiber": 3,
  "cholesterol": 45,
  "calcium": 80,
  "iron": 2,
  "ingredients": "Turkey, whole wheat tortilla, lettuce, tomato, mayo"
}
```

**Response** `201` — created food object with server-generated `id`

### `PUT /api/foods/:id`

Update a food item.

**Body** (partial — any fields)
```json
{ "calories": 380, "protein": 30 }
```

**Response** `200` — full updated food object

### `DELETE /api/foods/:id`

Delete a food item.

**Response** `204` No Content

---

## Menu Items

### `GET /api/menu-items`

List all menu items. Supports optional query filter.

| Query Param    | Description                     |
| -------------- | ------------------------------- |
| `restaurantId` | Filter by restaurant            |

**Example** `GET /api/menu-items?restaurantId=restaurant-1`

**Response** `200`
```json
[
  {
    "id": "menu-item-1",
    "name": "Healthy Lunch Combo",
    "restaurantId": "restaurant-1",
    "foods": [
      {
        "food": {
          "id": "food-1",
          "name": "Caesar Salad",
          "calories": 400
        },
        "quantity": 1
      }
    ],
    "possibleFoods": [
      {
        "food": {
          "id": "food-2",
          "name": "Grilled Chicken Breast",
          "calories": 250
        },
        "quantity": 1
      }
    ],
    "sizes": []
  },
  {
    "id": "menu-item-3",
    "name": "Pizza Feast",
    "restaurantId": "restaurant-3",
    "foods": [],
    "possibleFoods": [],
    "sizes": [
      {
        "name": "Regular",
        "foods": [
          {
            "food": { "id": "food-4", "name": "Margherita Pizza", "calories": 650 },
            "quantity": 2
          }
        ],
        "possibleFoods": [
          {
            "food": { "id": "food-5", "name": "Pepperoni Pizza", "calories": 750 },
            "quantity": 1
          }
        ]
      },
      {
        "name": "Family",
        "foods": [
          {
            "food": { "id": "food-4", "name": "Margherita Pizza", "calories": 650 },
            "quantity": 4
          },
          {
            "food": { "id": "food-5", "name": "Pepperoni Pizza", "calories": 750 },
            "quantity": 2
          }
        ],
        "possibleFoods": []
      }
    ]
  }
]
```

> **Note:** `foods` are the default included foods (used when `sizes` is empty). `possibleFoods` at the top level are optional add-ons (used when `sizes` is empty). `sizes` is an optional array where each entry has a custom `name` (any string), its own `foods` array, and its own `possibleFoods` array. When `sizes` is non-empty, the per-size `foods` and `possibleFoods` take precedence over the top-level ones (which are typically `[]`). All food arrays use the `MenuItemFood` format (`{ food, quantity }`).

### `GET /api/menu-items/:id`

Get a single menu item by ID.

**Response** `200` — menu item object (same shape as above)

### `POST /api/menu-items`

Create a new menu item.

**Body**

Without sizes:
```json
{
  "name": "Breakfast Special",
  "restaurantId": "restaurant-5",
  "foods": [
    { "food": { "id": "food-8", "...": "full food object" }, "quantity": 1 }
  ],
  "possibleFoods": [
    { "food": { "id": "food-9", "...": "full food object" }, "quantity": 1 }
  ],
  "sizes": []
}
```

With sizes (size names can be any string):
```json
{
  "name": "Pizza Feast",
  "restaurantId": "restaurant-3",
  "foods": [],
  "possibleFoods": [],
  "sizes": [
    {
      "name": "Regular",
      "foods": [
        { "food": { "id": "food-4", "...": "full food object" }, "quantity": 2 }
      ],
      "possibleFoods": [
        { "food": { "id": "food-5", "...": "full food object" }, "quantity": 1 }
      ]
    },
    {
      "name": "Family",
      "foods": [
        { "food": { "id": "food-4", "...": "full food object" }, "quantity": 4 },
        { "food": { "id": "food-5", "...": "full food object" }, "quantity": 2 }
      ],
      "possibleFoods": []
    }
  ]
}
```

> Your server implementation may alternatively accept a simplified format using `foodId` instead of the full `food` object, resolving them server-side.

**Response** `201` — created menu item with full food objects

### `PUT /api/menu-items/:id`

Update a menu item.

**Body** (partial — any fields, including `sizes`)
```json
{
  "name": "Updated Combo",
  "foods": [
    { "food": { "id": "food-1", "...": "..." }, "quantity": 3 }
  ],
  "possibleFoods": [],
  "sizes": [
    {
      "name": "Small",
      "foods": [{ "food": { "id": "food-1", "...": "..." }, "quantity": 1 }],
      "possibleFoods": []
    }
  ]
}
```

**Response** `200` — full updated menu item object

### `DELETE /api/menu-items/:id`

Delete a menu item.

**Response** `204` No Content

---

## Data Models

### Section
| Field  | Type   | Required |
| ------ | ------ | -------- |
| id     | string | auto     |
| name   | string | yes      |

### Restaurant
| Field     | Type     | Required |
| --------- | -------- | -------- |
| id        | string   | auto     |
| name      | string   | yes      |
| sectionId | string   | yes      |
| location  | Location | yes      |

### Location
| Field     | Type   | Required |
| --------- | ------ | -------- |
| longitude | number | yes      |
| latitude  | number | yes      |

### Food
| Field          | Type   | Required |
| -------------- | ------ | -------- |
| id             | string | auto     |
| name           | string | yes      |
| restaurantId   | string | yes      |
| quantity       | number | yes      |
| servingSize    | string | no       |
| calories       | number | no       |
| caloriesFromFat| number | no       |
| protein        | number | no       |
| carbs          | number | no       |
| fat            | number | no       |
| saturatedFat   | number | no       |
| sugar          | number | no       |
| addedSugars    | number | no       |
| sodium         | number | no       |
| dietaryFiber   | number | no       |
| cholesterol    | number | no       |
| calcium        | number | no       |
| iron           | number | no       |
| ingredients    | string | no       |

### MenuItem
| Field         | Type             | Required |
| ------------- | ---------------- | -------- |
| id            | string           | auto     |
| name          | string           | yes      |
| restaurantId  | string           | yes      |
| foods         | MenuItemFood[]   | yes      |
| possibleFoods | MenuItemFood[]   | no       |
| sizes         | MenuItemSize[]   | no       |

> **Without sizes:** `foods` are the default included foods. `possibleFoods` are optional add-ons. Both default to `[]` if omitted.
>
> **With sizes:** When `sizes` is non-empty, each size defines its own `name`, `foods` array, and `possibleFoods` array. The top-level `foods` and `possibleFoods` are typically `[]` in this case. Size names can be any string (e.g., "Small", "Large", "Kids", "Family").

### MenuItemSize
| Field         | Type           | Required |
| ------------- | -------------- | -------- |
| name          | string         | yes      |
| foods         | MenuItemFood[] | yes      |
| possibleFoods | MenuItemFood[] | no       |

### MenuItemFood
| Field    | Type   | Required |
| -------- | ------ | -------- |
| food     | Food   | yes      |
| quantity | number | yes      |

---

## Quick Start

1. **localStorage mode (default)** — no setup needed:
   ```ts
   // src/config.ts
   export const USE_API = false;
   ```

2. **API mode** — point to your server:
   ```ts
   // src/config.ts
   export const USE_API = true;
   export const API_BASE_URL = 'http://localhost:3000/api';
   ```

3. Run the dashboard:
   ```bash
   npm run dev
   ```

The app will use the selected data source transparently. All pages and forms work identically in both modes.
