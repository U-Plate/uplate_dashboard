# UPlate Dashboard — API Reference

## Conventions

| Convention        | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| Content-Type      | `application/json`                                           |
| ID format         | Server-generated string                                      |
| Success responses | `200`                                                        |
| Error responses   | `400` (bad request), `404` (not found), `500` (server error) |

---

## Sections

### `GET /:school/sections`

List all sections.

**Response** `200`
```json
[
  { "status": true, "id": "section-1", "name": "North Campus" }
]
```

### `GET /:school/sections/:id`

Get a single section by ID.

**Response** `200`
```json
{ "status": true, "id": "section-1", "name": "North Campus", "" }
```

### `POST /:school/admin/sections/addSection`

Create a new section.

**Body**
```json
{ "name": "East Campus", "key": "boilerfueladmin" }
```

**Response** `200`
```json
{ "status": true, "id": "section-4", "name": "East Campus" }
```

### `POST /:school/admin/sections/updateSection`

Update a section.

**Body**
```json
{ "name": "New Name", "id": "section-4", "key": "boilerfueladmin" }
```

**Response** `200`
```json
{ "status": true, "id": "section-1", "name": "Updated Name" }
```

### `POST /:school/admin/sections/deleteSection`

Delete a section.

**Body**
```json
{ "id": "section-4", "key": "boilerfueladmin" }
```

**Response** `200` 
```json
{ "status": true }
```

---

## Restaurants

### `GET /:school/restaurants`

List all restaurants. Supports optional query filter.

| Query Param  | Description                     |
| ------------ | ------------------------------- |
| `sectionId`  | Filter by section               |

**Example** `GET /:school/restaurants?section=section-1`

**Response** `200`
```json
[
  {
    "id": "restaurant-1",
    "name": "Campus Café",
    "section": "section-1",
    "location": { "longitude": -122.4194, "latitude": 37.7749, "address": "400 N Mccutcheon Drive, West Lafayette, IN, 47906" }
  }
]
```

### `GET /:school/restaurants/:id`

Get a single restaurant by ID.

**Response** `200`
```json
{
  "id": "restaurant-1",
  "name": "Campus Café",
  "section": "section-1",
  "location": { "longitude": -122.4194, "latitude": 37.7749, "address": "400 N Mccutcheon Drive, West Lafayette, IN, 47906" }
}
```

### `POST /:school/admin/restaurants/createRestaurant`

Create a new restaurant.

**Body**
```json
{
  "name": "New Place",
  "section": "section-1",
  "location": { "longitude": -122.42, "latitude": 37.78, "address": "400 N Mccutcheon Drive, West Lafayette, IN, 47906" },
  "key": "boilerfueladmin"
}
```

### `POST /:school/admin/restaurants/deleteRestaurant/:id`

Delete a restaurant.

**Body**
```json
{
  "key": "boilerfueladmin"
}
```

**Response** `200`
```json
{
  "id": "restaurant-6",
  "name": "New Place",
  "section": "section-1",
  "location": { "longitude": -122.42, "latitude": 37.78, "address": "400 N Mccutcheon Drive, West Lafayette, IN, 47906" }
}
```

### `POST /:school/admin/restaurants/:id`

Update a restaurant.

**Body** (partial — any fields)
```json
{ "name": "Renamed Place",
  "key": "boilerfueladmin" }
```

**Response** `200` — full updated restaurant object

### `POST /:school/admin/restaurants/move/:id`

Move a restaurant to a different section.

**Body**
```json
{ "toSection": "section-2",
  "key": "boilerfueladmin" }
```

**Response** `200` — full updated restaurant object

### `POST /:school/admin/restaurants/:id`

Delete a restaurant.

**Response** `204` No Content

---

## Foods

### `GET /:school/restaurants/:id/menus`

List all food items. Supports optional query filter.

| Query Param    | Description                     |
| -------------- | ------------------------------- |
| `restaurantId` | Filter by restaurant            |

**Example** `GET /purdue/restaurants/restaurant-1/menus`

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

### `GET /:school/restaurants/:id/foods/:foodId`

Get a single food item by ID.

**Response** `200`
```json
{
	"status": true,
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
```

### `POST /:school/admin/restaurants/:id/newFood/:foodId`

Create a new food item.

**Response** `200`
```json
{ "status": true }
```

**Body**
```json
{
  "name": "Turkey Wrap",
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

**Response** `200`
```json
{ "status": true }
```

### `POST /:school/admin/restaurants/:id/updateFood/:foodId`

Update a food item.

**Body** (partial — any fields)
```json
{ "calories": 380, "protein": 30 }
```

**Response** `200` — full updated food object

### `POST /:school/admin/restaurants/:id/deleteFood/:foodId`

Delete a food item.

**Body**
```json
{ "key": "boilerfuelkey" }
```

**Response** `200` 
```json
{ "status": true }
```

---

## Menu Items

### `GET /:school/restaurants/:id/menuItems`

List all menu items for a restaurant.

**Example** `GET /purdue/restaurants/restaurant-1/menuItems`

**Response** `200`
```json
[
  {
    "id": "menuitem-1",
    "name": "Caesar Salad Combo",
    "restaurantId": "restaurant-1",
    "foods": [
      { "food": { "id": "food-1", "name": "Caesar Salad" }, "quantity": 1 }
    ],
    "possibleFoods": [],
    "sizes": []
  }
]
```

### `GET /:school/restaurants/:id/menuItems/:menuItemId`

Get a single menu item by ID.

**Response** `200`
```json
{
  "id": "menuitem-1",
  "name": "Caesar Salad Combo",
  "restaurantId": "restaurant-1",
  "foods": [
    { "food": { "id": "food-1", "name": "Caesar Salad" }, "quantity": 1 }
  ],
  "possibleFoods": [],
  "sizes": []
}
```

### `POST /:school/admin/restaurants/:id/newMenuItem`

Create a new menu item.

**Body**
```json
{
  "name": "Turkey Wrap Combo",
  "foods": [
    { "food": "food-2", "quantity": 1 }
  ],
  "possibleFoods": [
    { "foodId": "food-3", "quantity": 1, "size": "Small" },
    { "foodId": "food-3", "quantity": 2, "size": "Large" }
  ],
  "key": "boilerfueladmin"
}
```

> Size variants are represented as `possibleFoods` entries with an optional `size` field (e.g., `"Small"`, `"Large"`). There is no separate `sizes` array.

**Response** `200`
```json
{ "status": true }
```

### `POST /:school/admin/restaurants/:id/updateMenuItem/:menuItemId`

Update a menu item.

**Body** (partial — any fields)
```json
{ "name": "Updated Combo", "key": "boilerfueladmin" }
```

**Response** `200` — full updated menu item object

### `POST /:school/admin/restaurants/:id/deleteMenuItem/:menuItemId`

Delete a menu item.

**Body**
```json
{ "key": "boilerfueladmin" }
```

**Response** `200`
```json
{ "status": true }
```

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
| Field         | Type           | Required |
| ------------- | -------------- | -------- |
| id            | string         | auto     |
| name          | string         | yes      |
| restaurantId  | string         | yes      |
| foods         | MenuItemFood[] | yes      |
| possibleFoods | MenuItemFood[] | no       |

> `foods` are the default included foods. `possibleFoods` are optional add-ons or size variants. Both default to `[]` if omitted.

### MenuItemFood
| Field    | Type   | Required |
| -------- | ------ | -------- |
| foodId   | string | yes (food ID) |
| quantity | number | yes      |
| size     | string | no — present when this entry represents a size variant (e.g., `"Small"`, `"Large"`) |
