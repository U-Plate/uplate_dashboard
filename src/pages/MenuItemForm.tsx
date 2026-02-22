import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMenuItems } from '../contexts/MenuItemsContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { useFoods } from '../contexts/FoodContext';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import type { MenuItemSize } from '../constants';
import './MenuItemForm.css';

interface SizeState {
  name: string;
  foodQuantities: Map<string, number>;
  possibleFoodQuantities: Map<string, number>;
}

export const MenuItemForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: restaurantId, menuItemId } = useParams<{ id: string; menuItemId: string }>();
  const { addMenuItem, updateMenuItem, getMenuItemById } = useMenuItems();
  const { getRestaurantById } = useRestaurants();
  const { foods, getFoodsByRestaurant } = useFoods();

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : undefined;

  const [name, setName] = useState('');
  const [foodQuantities, setFoodQuantities] = useState<Map<string, number>>(new Map());
  const [possibleFoodQuantities, setPossibleFoodQuantities] = useState<Map<string, number>>(new Map());
  const [useSizes, setUseSizes] = useState(false);
  const [sizes, setSizes] = useState<SizeState[]>([]);
  const [errors, setErrors] = useState<{ name?: string; foods?: string; sizes?: string }>({});

  const isEditMode = !!menuItemId;

  useEffect(() => {
    if (isEditMode && menuItemId) {
      const menuItem = getMenuItemById(menuItemId);
      if (menuItem) {
        setName(menuItem.name);

        const quantities = new Map<string, number>();
        menuItem.foods.forEach((mf) => quantities.set(mf.food.id, mf.quantity));
        setFoodQuantities(quantities);

        const possibleQuantities = new Map<string, number>();
        (menuItem.possibleFoods ?? []).forEach((mf) => possibleQuantities.set(mf.food.id, mf.quantity));
        setPossibleFoodQuantities(possibleQuantities);

        if (menuItem.sizes && menuItem.sizes.length > 0) {
          setUseSizes(true);
          setSizes(
            menuItem.sizes.map((s) => ({
              name: s.name,
              foodQuantities: new Map(s.foods.map((mf) => [mf.food.id, mf.quantity])),
              possibleFoodQuantities: new Map((s.possibleFoods ?? []).map((mf) => [mf.food.id, mf.quantity])),
            }))
          );
        }
      }
    }
  }, [menuItemId, isEditMode, getMenuItemById]);

  const availableFoods = restaurantId ? getFoodsByRestaurant(restaurantId) : [];
  const selectedFoodIds = new Set(foodQuantities.keys());
  const selectedPossibleFoodIds = new Set(possibleFoodQuantities.keys());

  // --- Default foods (no-sizes mode) ---

  const toggleFoodSelection = (foodId: string) => {
    const newQuantities = new Map(foodQuantities);
    if (newQuantities.has(foodId)) {
      newQuantities.delete(foodId);
    } else {
      newQuantities.set(foodId, 1);
      if (possibleFoodQuantities.has(foodId)) {
        const newPossible = new Map(possibleFoodQuantities);
        newPossible.delete(foodId);
        setPossibleFoodQuantities(newPossible);
      }
    }
    setFoodQuantities(newQuantities);
  };

  const togglePossibleFoodSelection = (foodId: string) => {
    const newQuantities = new Map(possibleFoodQuantities);
    if (newQuantities.has(foodId)) {
      newQuantities.delete(foodId);
    } else {
      newQuantities.set(foodId, 1);
      if (foodQuantities.has(foodId)) {
        const newDefault = new Map(foodQuantities);
        newDefault.delete(foodId);
        setFoodQuantities(newDefault);
      }
    }
    setPossibleFoodQuantities(newQuantities);
  };

  const updateFoodQuantity = (foodId: string, quantity: number) => {
    const newQuantities = new Map(foodQuantities);
    newQuantities.set(foodId, Math.max(1, quantity));
    setFoodQuantities(newQuantities);
  };

  const updatePossibleFoodQuantity = (foodId: string, quantity: number) => {
    const newQuantities = new Map(possibleFoodQuantities);
    newQuantities.set(foodId, Math.max(1, quantity));
    setPossibleFoodQuantities(newQuantities);
  };

  // --- Sizes ---

  const addSize = () => {
    setSizes([...sizes, { name: '', foodQuantities: new Map(), possibleFoodQuantities: new Map() }]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSizeName = (index: number, newName: string) => {
    const newSizes = [...sizes];
    newSizes[index] = { ...newSizes[index], name: newName };
    setSizes(newSizes);
  };

  const toggleSizeFoodSelection = (sizeIndex: number, foodId: string) => {
    const newSizes = [...sizes];
    const sizeState = newSizes[sizeIndex];
    const newQuantities = new Map(sizeState.foodQuantities);
    if (newQuantities.has(foodId)) {
      newQuantities.delete(foodId);
    } else {
      newQuantities.set(foodId, 1);
    }
    newSizes[sizeIndex] = { ...sizeState, foodQuantities: newQuantities };
    setSizes(newSizes);
  };

  const updateSizeFoodQuantity = (sizeIndex: number, foodId: string, quantity: number) => {
    const newSizes = [...sizes];
    const sizeState = newSizes[sizeIndex];
    const newQuantities = new Map(sizeState.foodQuantities);
    newQuantities.set(foodId, Math.max(1, quantity));
    newSizes[sizeIndex] = { ...sizeState, foodQuantities: newQuantities };
    setSizes(newSizes);
  };

  const toggleSizePossibleFoodSelection = (sizeIndex: number, foodId: string) => {
    const newSizes = [...sizes];
    const sizeState = newSizes[sizeIndex];
    const newQuantities = new Map(sizeState.possibleFoodQuantities);
    if (newQuantities.has(foodId)) {
      newQuantities.delete(foodId);
    } else {
      newQuantities.set(foodId, 1);
      // Remove from size's default foods if present
      if (sizeState.foodQuantities.has(foodId)) {
        const newFoodQty = new Map(sizeState.foodQuantities);
        newFoodQty.delete(foodId);
        newSizes[sizeIndex] = { ...sizeState, foodQuantities: newFoodQty, possibleFoodQuantities: newQuantities };
        setSizes(newSizes);
        return;
      }
    }
    newSizes[sizeIndex] = { ...sizeState, possibleFoodQuantities: newQuantities };
    setSizes(newSizes);
  };

  const updateSizePossibleFoodQuantity = (sizeIndex: number, foodId: string, quantity: number) => {
    const newSizes = [...sizes];
    const sizeState = newSizes[sizeIndex];
    const newQuantities = new Map(sizeState.possibleFoodQuantities);
    newQuantities.set(foodId, Math.max(1, quantity));
    newSizes[sizeIndex] = { ...sizeState, possibleFoodQuantities: newQuantities };
    setSizes(newSizes);
  };

  const handleToggleSizes = () => {
    setUseSizes(!useSizes);
    if (!useSizes && sizes.length === 0) {
      setSizes([{ name: '', foodQuantities: new Map(), possibleFoodQuantities: new Map() }]);
    }
  };

  // --- Validation ---

  const validate = (): boolean => {
    const newErrors: { name?: string; foods?: string; sizes?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Menu item name is required';
    }

    if (useSizes) {
      if (sizes.length === 0) {
        newErrors.sizes = 'Please add at least one size';
      } else {
        const hasEmptyName = sizes.some((s) => !s.name.trim());
        const hasEmptyFoods = sizes.some((s) => s.foodQuantities.size === 0);
        if (hasEmptyName) {
          newErrors.sizes = 'All sizes must have a name';
        } else if (hasEmptyFoods) {
          newErrors.sizes = 'All sizes must have at least one food item';
        }
      }
    } else {
      if (foodQuantities.size === 0) {
        newErrors.foods = 'Please select at least one default food item';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submit ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const menuItemPossibleFoods = Array.from(possibleFoodQuantities.entries()).map(([foodId, quantity]) => ({
      food: foods.find((f) => f.id === foodId)!,
      quantity,
    }));

    let menuItemFoods;
    let menuItemSizes: MenuItemSize[];

    if (useSizes) {
      menuItemFoods = [] as { food: typeof foods[number]; quantity: number }[];
      menuItemSizes = sizes.map((s) => ({
        name: s.name.trim(),
        foods: Array.from(s.foodQuantities.entries()).map(([foodId, quantity]) => ({
          food: foods.find((f) => f.id === foodId)!,
          quantity,
        })),
        possibleFoods: Array.from(s.possibleFoodQuantities.entries()).map(([foodId, quantity]) => ({
          food: foods.find((f) => f.id === foodId)!,
          quantity,
        })),
      }));
    } else {
      menuItemFoods = Array.from(foodQuantities.entries()).map(([foodId, quantity]) => ({
        food: foods.find((f) => f.id === foodId)!,
        quantity,
      }));
      menuItemSizes = [];
    }

    const menuItemData = {
      name: name.trim(),
      restaurantId: restaurantId || '',
      foods: menuItemFoods,
      possibleFoods: useSizes ? [] : menuItemPossibleFoods,
      sizes: menuItemSizes,
    };

    if (isEditMode && menuItemId) {
      updateMenuItem(menuItemId, menuItemData);
    } else {
      addMenuItem(menuItemData);
    }

    navigate(`/restaurants/${restaurantId}`);
  };

  const goBack = () => navigate(`/restaurants/${restaurantId}`);

  // --- Nutrition helpers ---

  const computeNutritionTotals = (quantities: Map<string, number>) => {
    return Array.from(quantities.entries()).reduce(
      (acc, [foodId, qty]) => {
        const food = foods.find((f) => f.id === foodId);
        if (!food) return acc;
        return {
          calories: acc.calories + food.calories * qty,
          protein: acc.protein + food.protein * qty,
          carbs: acc.carbs + food.carbs * qty,
          fat: acc.fat + food.fat * qty,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // --- Render helpers ---

  const renderFoodCheckboxList = (
    selectedIds: Set<string>,
    dimmedIds: Set<string>,
    quantities: Map<string, number>,
    onToggle: (foodId: string) => void,
    onQuantityChange: (foodId: string, qty: number) => void
  ) => (
    <div className="menu-item-form__food-list">
      {availableFoods.map((food) => {
        const isSelected = selectedIds.has(food.id);
        const isDimmed = dimmedIds.has(food.id);
        const qty = quantities.get(food.id) || 1;
        return (
          <div
            key={food.id}
            className={`menu-item-form__food-checkbox${isDimmed ? ' menu-item-form__food-checkbox--dimmed' : ''}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(food.id)}
            />
            <div className="menu-item-form__food-info">
              <span className="menu-item-form__food-name">{food.name}</span>
              <span className="menu-item-form__food-nutrition">
                {food.calories} cal | {food.protein}g protein | {food.carbs}g carbs |{' '}
                {food.fat}g fat
              </span>
            </div>
            {isSelected && (
              <div className="menu-item-form__food-quantity">
                <label className="menu-item-form__food-quantity-label">Qty:</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) =>
                    onQuantityChange(food.id, parseInt(e.target.value) || 1)
                  }
                  className="menu-item-form__food-quantity-input"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderNutritionSummary = (quantities: Map<string, number>, title: string) => {
    if (quantities.size === 0) return null;
    const totals = computeNutritionTotals(quantities);
    return (
      <div className="menu-item-form__summary">
        <h3 className="menu-item-form__summary-title">{title}</h3>
        <div className="menu-item-form__summary-grid">
          <div className="menu-item-form__summary-item">
            <span className="menu-item-form__summary-label">Total Calories</span>
            <span className="menu-item-form__summary-value">{totals.calories} kcal</span>
          </div>
          <div className="menu-item-form__summary-item">
            <span className="menu-item-form__summary-label">Total Protein</span>
            <span className="menu-item-form__summary-value">{totals.protein}g</span>
          </div>
          <div className="menu-item-form__summary-item">
            <span className="menu-item-form__summary-label">Total Carbs</span>
            <span className="menu-item-form__summary-value">{totals.carbs}g</span>
          </div>
          <div className="menu-item-form__summary-item">
            <span className="menu-item-form__summary-label">Total Fat</span>
            <span className="menu-item-form__summary-value">{totals.fat}g</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="menu-item-form">
      <div className="menu-item-form__header">
        <h1 className="menu-item-form__title">
          {isEditMode ? 'Edit Menu Item' : 'Create New Menu Item'}
        </h1>
        {restaurant && (
          <p className="menu-item-form__subtitle">for {restaurant.name}</p>
        )}
      </div>

      <form className="menu-item-form__form" onSubmit={handleSubmit}>
        <FormField
          label="Menu Item Name"
          type="text"
          value={name}
          onChange={(value) => setName(value as string)}
          error={errors.name}
          required
          placeholder="e.g., Healthy Lunch Combo"
        />

        {/* Sizes toggle */}
        {availableFoods.length > 0 && (
          <div className="menu-item-form__sizes-toggle">
            <label className="menu-item-form__sizes-toggle-label">
              <input
                type="checkbox"
                checked={useSizes}
                onChange={handleToggleSizes}
              />
              <span>Enable sizes</span>
            </label>
            <p className="menu-item-form__section-hint">
              {useSizes
                ? 'Each size has its own name and default foods.'
                : 'Enable sizes to offer different portions with different default foods.'}
            </p>
          </div>
        )}

        {/* === No-sizes mode: single default foods list === */}
        {!useSizes && (
          <>
            <div className="form-field">
              <label className="form-field__label">
                Default Foods <span className="form-field__required"> *</span>
                <span className="menu-item-form__selected-count">
                  {' '}
                  ({selectedFoodIds.size} selected)
                </span>
              </label>
              <p className="menu-item-form__section-hint">
                These foods are included by default in this menu item.
              </p>

              {availableFoods.length === 0 ? (
                <div className="menu-item-form__no-foods">
                  <p>No food items available for this restaurant.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/restaurants/${restaurantId}/foods/new`)}
                  >
                    Create Food Item
                  </Button>
                </div>
              ) : (
                renderFoodCheckboxList(
                  selectedFoodIds,
                  selectedPossibleFoodIds,
                  foodQuantities,
                  toggleFoodSelection,
                  updateFoodQuantity
                )
              )}

              {errors.foods && <div className="form-field__error">{errors.foods}</div>}
            </div>

            {renderNutritionSummary(foodQuantities, 'Nutrition Summary (Default Foods)')}
          </>
        )}

        {/* === Sizes mode === */}
        {useSizes && (
          <div className="menu-item-form__sizes-section">
            <div className="menu-item-form__sizes-header">
              <label className="form-field__label">
                Sizes <span className="form-field__required"> *</span>
                <span className="menu-item-form__selected-count">
                  {' '}
                  ({sizes.length} size{sizes.length !== 1 ? 's' : ''})
                </span>
              </label>
            </div>

            {errors.sizes && <div className="form-field__error">{errors.sizes}</div>}

            {sizes.map((size, sizeIndex) => {
              const sizeFoodIds = new Set(size.foodQuantities.keys());
              const sizePossibleFoodIds = new Set(size.possibleFoodQuantities.keys());
              return (
                <div key={sizeIndex} className="menu-item-form__size-card">
                  <div className="menu-item-form__size-card-header">
                    <input
                      type="text"
                      className="menu-item-form__size-name-input"
                      placeholder="Size name (e.g., Small, Large, Kids)"
                      value={size.name}
                      onChange={(e) => updateSizeName(sizeIndex, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removeSize(sizeIndex)}
                    >
                      Remove
                    </Button>
                  </div>

                  <p className="menu-item-form__section-hint">
                    Default foods for the "{size.name || '...'}" size ({sizeFoodIds.size} selected)
                  </p>

                  {renderFoodCheckboxList(
                    sizeFoodIds,
                    sizePossibleFoodIds,
                    size.foodQuantities,
                    (foodId) => toggleSizeFoodSelection(sizeIndex, foodId),
                    (foodId, qty) => updateSizeFoodQuantity(sizeIndex, foodId, qty)
                  )}

                  {renderNutritionSummary(
                    size.foodQuantities,
                    `Nutrition — ${size.name || 'Unnamed Size'}`
                  )}

                  <p className="menu-item-form__section-hint" style={{ marginTop: '1rem' }}>
                    Possible add-ons for the "{size.name || '...'}" size ({sizePossibleFoodIds.size} selected)
                  </p>

                  {renderFoodCheckboxList(
                    sizePossibleFoodIds,
                    sizeFoodIds,
                    size.possibleFoodQuantities,
                    (foodId) => toggleSizePossibleFoodSelection(sizeIndex, foodId),
                    (foodId, qty) => updateSizePossibleFoodQuantity(sizeIndex, foodId, qty)
                  )}
                </div>
              );
            })}

            <Button type="button" variant="secondary" onClick={addSize}>
              + Add Size
            </Button>
          </div>
        )}

        {/* Possible Foods (only in no-sizes mode) */}
        {!useSizes && availableFoods.length > 0 && (
          <div className="form-field">
            <label className="form-field__label">
              Possible Foods
              <span className="menu-item-form__selected-count">
                {' '}
                ({selectedPossibleFoodIds.size} selected)
              </span>
            </label>
            <p className="menu-item-form__section-hint">
              Optional add-ons that can be added but are not included by default.
            </p>

            <div className="menu-item-form__food-list">
              {availableFoods.map((food) => {
                const isPossible = selectedPossibleFoodIds.has(food.id);
                const isDefault = !useSizes && selectedFoodIds.has(food.id);
                const qty = possibleFoodQuantities.get(food.id) || 1;
                return (
                  <div
                    key={food.id}
                    className={`menu-item-form__food-checkbox${isDefault ? ' menu-item-form__food-checkbox--dimmed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isPossible}
                      onChange={() => togglePossibleFoodSelection(food.id)}
                    />
                    <div className="menu-item-form__food-info">
                      <span className="menu-item-form__food-name">{food.name}</span>
                      <span className="menu-item-form__food-nutrition">
                        {food.calories} cal | {food.protein}g protein | {food.carbs}g carbs |{' '}
                        {food.fat}g fat
                      </span>
                    </div>
                    {isPossible && (
                      <div className="menu-item-form__food-quantity">
                        <label className="menu-item-form__food-quantity-label">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) =>
                            updatePossibleFoodQuantity(food.id, parseInt(e.target.value) || 1)
                          }
                          className="menu-item-form__food-quantity-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="menu-item-form__actions">
          <Button type="button" variant="secondary" onClick={goBack}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditMode ? 'Update Menu Item' : 'Create Menu Item'}
          </Button>
        </div>
      </form>
    </div>
  );
};
