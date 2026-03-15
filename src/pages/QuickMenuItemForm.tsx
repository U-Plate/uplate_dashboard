import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMenuItems } from '../contexts/MenuItemsContext';
import { useFoods } from '../contexts/FoodContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import type { Food, MenuItemSize } from '../constants';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './QuickMenuItemForm.css';

interface SizeEntry {
  name: string;
  defaults: string;
  addons: string;
}

interface ResolvedFood {
  inputName: string;
  food: Food | null;
  matchedBy: 'formatted' | 'exact' | null;
  /** The formatted name that would be used: "[Menu Item Name] [Food Name] ([Size])" */
  formattedName: string;
}

function resolveFood(
  menuItemName: string,
  foodName: string,
  sizeName: string,
  restaurantFoods: Food[]
): ResolvedFood {
  const trimmed = foodName.trim();
  const formattedName = `${menuItemName} ${trimmed} (${sizeName})`;
  if (!trimmed) return { inputName: trimmed, food: null, matchedBy: null, formattedName };

  const find = (name: string) =>
    restaurantFoods.find((f) => f.name.toLowerCase() === name.toLowerCase());

  // 1. Try "[Menu Item Name] [Food Name] ([Size Name])"
  const fullMatch = find(formattedName);
  if (fullMatch) {
    return { inputName: trimmed, food: fullMatch, matchedBy: 'formatted', formattedName };
  }

  // 2. Try "[Food Name] ([Size Name])"
  const sizedMatch = find(`${trimmed} (${sizeName})`);
  if (sizedMatch) {
    return { inputName: trimmed, food: sizedMatch, matchedBy: 'formatted', formattedName };
  }

  // 3. Try "[Food Name]"
  const exactMatch = find(trimmed);
  if (exactMatch) {
    return { inputName: trimmed, food: exactMatch, matchedBy: 'exact', formattedName };
  }

  return { inputName: trimmed, food: null, matchedBy: null, formattedName };
}

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

const DEFAULT_FOOD_FORM = {
  name: '',
  quantity: 1,
  servingSize: '',
  ingredients: '',
  calories: 0,
  caloriesFromFat: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  saturatedFat: 0,
  sugar: 0,
  addedSugars: 0,
  sodium: 0,
  dietaryFiber: 0,
  cholesterol: 0,
  calcium: 0,
  iron: 0,
  labelsInput: '',
};

type FoodFormData = typeof DEFAULT_FOOD_FORM;

export const QuickMenuItemForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: restaurantId } = useParams<{ id: string }>();
  const { addMenuItem } = useMenuItems();
  const { getFoodsByRestaurant, addFood } = useFoods();
  const { getRestaurantById } = useRestaurants();

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : undefined;
  const restaurantFoods = restaurantId ? getFoodsByRestaurant(restaurantId) : [];

  const [name, setName] = useState('');
  const [sizes, setSizes] = useState<SizeEntry[]>([{ name: '', defaults: '', addons: '' }]);
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Food creation modal state
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [foodForm, setFoodForm] = useState<FoodFormData>({ ...DEFAULT_FOOD_FORM });
  const [foodFormErrors, setFoodFormErrors] = useState<{ name?: string }>({});

  const resolvedFoods = useMemo(() => {
    return sizes.map((size) => {
      const defaultLines = parseLines(size.defaults);
      const addonLines = parseLines(size.addons);
      return {
        defaults: defaultLines.map((line) =>
          resolveFood(name, line, size.name, restaurantFoods)
        ),
        addons: addonLines.map((line) =>
          resolveFood(name, line, size.name, restaurantFoods)
        ),
      };
    });
  }, [name, sizes, restaurantFoods]);

  const addSize = () => {
    setSizes([...sizes, { name: '', defaults: '', addons: '' }]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof SizeEntry, value: string) => {
    setSizes(sizes.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const validate = (): boolean => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Menu item name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const sizeData: MenuItemSize[] = sizes.map((size, sizeIdx) => {
      const resolved = resolvedFoods[sizeIdx];
      return {
        name: size.name,
        foods: resolved.defaults
          .filter((r) => r.food !== null)
          .map((r) => ({ food: r.food!, quantity: 1 })),
        possibleFoods: resolved.addons
          .filter((r) => r.food !== null)
          .map((r) => ({ food: r.food!, quantity: 1 })),
      };
    });

    addMenuItem({
      name: name.trim(),
      restaurantId: restaurantId || '',
      foods: [],
      possibleFoods: [],
      sizes: sizeData,
    });

    navigate(`/restaurants/${restaurantId}`);
  };

  const goBack = () => navigate(`/restaurants/${restaurantId}`);

  // Food creation modal handlers
  const openCreateFood = (suggestedName: string) => {
    setFoodForm({ ...DEFAULT_FOOD_FORM, name: suggestedName });
    setFoodFormErrors({});
    setFoodModalOpen(true);
  };

  const updateFoodField = (field: string, value: string | number) => {
    setFoodForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateFood = async () => {
    if (!foodForm.name.trim()) {
      setFoodFormErrors({ name: 'Food name is required' });
      return;
    }
    setFoodFormErrors({});

    const labels = foodForm.labelsInput
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    const { labelsInput: _, ...rest } = foodForm;
    await addFood({
      ...rest,
      name: foodForm.name.trim(),
      restaurantId: restaurantId || '',
      labels,
    });

    setFoodModalOpen(false);
  };

  const totalResolved = resolvedFoods.reduce(
    (sum, s) =>
      sum +
      s.defaults.filter((r) => r.food).length +
      s.addons.filter((r) => r.food).length,
    0
  );
  const totalUnresolved = resolvedFoods.reduce(
    (sum, s) =>
      sum +
      s.defaults.filter((r) => !r.food && r.inputName).length +
      s.addons.filter((r) => !r.food && r.inputName).length,
    0
  );

  const renderResolvedItem = (r: ResolvedFood, i: number) => (
    <div
      key={i}
      className={`quick-menu-form__resolved-item ${
        r.food
          ? 'quick-menu-form__resolved-item--found'
          : 'quick-menu-form__resolved-item--missing'
      }`}
    >
      <span className="quick-menu-form__resolved-icon">
        {r.food ? '\u2713' : '\u2717'}
      </span>
      <span className="quick-menu-form__resolved-input">{r.inputName}</span>
      {r.food && (
        <span className="quick-menu-form__resolved-match">
          {r.matchedBy === 'formatted' ? r.food.name : `(exact) ${r.food.name}`}
        </span>
      )}
      {!r.food && (
        <>
          <span className="quick-menu-form__resolved-match">Not found</span>
          <button
            type="button"
            className="quick-menu-form__create-food-btn"
            onClick={() => openCreateFood(r.formattedName)}
          >
            Create
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="quick-menu-form">
      <div className="quick-menu-form__header">
        <h1 className="quick-menu-form__title">Quick Add Menu Item</h1>
        {restaurant && (
          <p className="quick-menu-form__subtitle">for {restaurant.name}</p>
        )}
      </div>

      <form className="quick-menu-form__form" onSubmit={handleSubmit}>
        <FormField
          label="Menu Item Name"
          type="text"
          value={name}
          onChange={(value) => setName(value as string)}
          error={errors.name}
          required
          placeholder="e.g., Mike's Hot Italian"
        />

        <p className="quick-menu-form__hint">
          Food names are resolved as: <strong>{name || '[Menu Item Name]'} [Food Name] ([Size])</strong>.
          If not found, falls back to the food name as typed.
        </p>

        <div className="quick-menu-form__sizes">
          <h3>Sizes ({sizes.length})</h3>

          {sizes.map((size, sizeIdx) => {
            const resolved = resolvedFoods[sizeIdx];
            return (
              <div key={sizeIdx} className="quick-menu-form__size-card">
                <div className="quick-menu-form__size-card-header">
                  <input
                    type="text"
                    className="quick-menu-form__size-name-input"
                    placeholder="Size name (e.g., Regular, Giant)"
                    value={size.name}
                    onChange={(e) => updateSize(sizeIdx, 'name', e.target.value)}
                  />
                  <Button
                    variant="danger"
                    onClick={() => removeSize(sizeIdx)}
                    disabled={sizes.length <= 1}
                  >
                    Remove
                  </Button>
                </div>

                <div className="quick-menu-form__food-inputs">
                  <div className="quick-menu-form__food-input-group">
                    <label className="quick-menu-form__label">Default Foods (one per line)</label>
                    <textarea
                      className="quick-menu-form__textarea"
                      placeholder={"Ham\nLettuce\nTomato"}
                      value={size.defaults}
                      onChange={(e) => updateSize(sizeIdx, 'defaults', e.target.value)}
                      rows={5}
                    />
                    {resolved.defaults.length > 0 && (
                      <div className="quick-menu-form__resolved-list">
                        {resolved.defaults.map(renderResolvedItem)}
                      </div>
                    )}
                  </div>

                  <div className="quick-menu-form__food-input-group">
                    <label className="quick-menu-form__label">Possible Add-ons (one per line)</label>
                    <textarea
                      className="quick-menu-form__textarea"
                      placeholder={"Extra Cheese\nBacon"}
                      value={size.addons}
                      onChange={(e) => updateSize(sizeIdx, 'addons', e.target.value)}
                      rows={5}
                    />
                    {resolved.addons.length > 0 && (
                      <div className="quick-menu-form__resolved-list">
                        {resolved.addons.map(renderResolvedItem)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Button variant="secondary" onClick={addSize}>
            Add Size
          </Button>
        </div>

        <div className="quick-menu-form__status">
          <span className="quick-menu-form__status-resolved">
            {totalResolved} food{totalResolved !== 1 ? 's' : ''} resolved
          </span>
          {totalUnresolved > 0 && (
            <span className="quick-menu-form__status-unresolved">
              {totalUnresolved} not found
            </span>
          )}
        </div>

        <div className="quick-menu-form__actions">
          <Button type="button" variant="secondary" onClick={goBack}>
            Cancel
          </Button>
          <Button type="submit">Create Menu Item</Button>
        </div>
      </form>

      {/* Create Food Modal */}
      <Modal
        isOpen={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        title="Create Food Item"
        onConfirm={handleCreateFood}
        confirmText="Create Food"
      >
        <div className="quick-menu-form__food-modal">
          <div className="quick-menu-form__food-modal-section">
            <h3 className="quick-menu-form__food-modal-section-title">Basic Information</h3>
            <FormField
              label="Food Name"
              type="text"
              value={foodForm.name}
              onChange={(value) => updateFoodField('name', value)}
              error={foodFormErrors.name}
              required
            />
            <FormField
              label="Serving Size"
              type="text"
              value={foodForm.servingSize}
              onChange={(value) => updateFoodField('servingSize', value)}
              placeholder="e.g., 300g"
            />
            <FormField
              label="Labels"
              type="text"
              value={foodForm.labelsInput}
              onChange={(value) => setFoodForm((prev) => ({ ...prev, labelsInput: value as string }))}
              placeholder="e.g., Breakfast, Gluten-Free (comma-separated)"
            />
            <FormField
              label="Ingredients"
              type="textarea"
              value={foodForm.ingredients}
              onChange={(value) => updateFoodField('ingredients', value)}
              placeholder="List all ingredients..."
            />
          </div>

          <div className="quick-menu-form__food-modal-section">
            <h3 className="quick-menu-form__food-modal-section-title">Macronutrients</h3>
            <div className="quick-menu-form__food-modal-grid">
              <FormField
                label="Calories (kcal)"
                type="number"
                value={foodForm.calories}
                onChange={(value) => updateFoodField('calories', value)}
              />
              <FormField
                label="Calories from Fat (kcal)"
                type="number"
                value={foodForm.caloriesFromFat}
                onChange={(value) => updateFoodField('caloriesFromFat', value)}
              />
            </div>
            <div className="quick-menu-form__food-modal-grid">
              <FormField
                label="Protein (g)"
                type="number"
                value={foodForm.protein}
                onChange={(value) => updateFoodField('protein', value)}
              />
              <FormField
                label="Carbs (g)"
                type="number"
                value={foodForm.carbs}
                onChange={(value) => updateFoodField('carbs', value)}
              />
              <FormField
                label="Fat (g)"
                type="number"
                value={foodForm.fat}
                onChange={(value) => updateFoodField('fat', value)}
              />
              <FormField
                label="Saturated Fat (g)"
                type="number"
                value={foodForm.saturatedFat}
                onChange={(value) => updateFoodField('saturatedFat', value)}
              />
            </div>
            <div className="quick-menu-form__food-modal-grid">
              <FormField
                label="Sugar (g)"
                type="number"
                value={foodForm.sugar}
                onChange={(value) => updateFoodField('sugar', value)}
              />
              <FormField
                label="Added Sugars (g)"
                type="number"
                value={foodForm.addedSugars}
                onChange={(value) => updateFoodField('addedSugars', value)}
              />
              <FormField
                label="Dietary Fiber (g)"
                type="number"
                value={foodForm.dietaryFiber}
                onChange={(value) => updateFoodField('dietaryFiber', value)}
              />
              <FormField
                label="Cholesterol (mg)"
                type="number"
                value={foodForm.cholesterol}
                onChange={(value) => updateFoodField('cholesterol', value)}
              />
            </div>
            <FormField
              label="Sodium (mg)"
              type="number"
              value={foodForm.sodium}
              onChange={(value) => updateFoodField('sodium', value)}
            />
          </div>

          <div className="quick-menu-form__food-modal-section">
            <h3 className="quick-menu-form__food-modal-section-title">Micronutrients</h3>
            <div className="quick-menu-form__food-modal-grid">
              <FormField
                label="Calcium (mg)"
                type="number"
                value={foodForm.calcium}
                onChange={(value) => updateFoodField('calcium', value)}
              />
              <FormField
                label="Iron (mg)"
                type="number"
                value={foodForm.iron}
                onChange={(value) => updateFoodField('iron', value)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
