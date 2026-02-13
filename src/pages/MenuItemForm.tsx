import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMenuItems } from '../contexts/MenuItemsContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { useFoods } from '../contexts/FoodContext';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import './MenuItemForm.css';

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
  const [errors, setErrors] = useState<{ name?: string; foods?: string }>({});

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
      }
    }
  }, [menuItemId, isEditMode, getMenuItemById]);

  const availableFoods = restaurantId ? getFoodsByRestaurant(restaurantId) : [];
  const selectedFoodIds = new Set(foodQuantities.keys());
  const selectedPossibleFoodIds = new Set(possibleFoodQuantities.keys());

  const toggleFoodSelection = (foodId: string) => {
    const newQuantities = new Map(foodQuantities);
    if (newQuantities.has(foodId)) {
      newQuantities.delete(foodId);
    } else {
      newQuantities.set(foodId, 1);
      // Remove from possible foods if it was there
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
      // Remove from default foods if it was there
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

  const validate = (): boolean => {
    const newErrors: { name?: string; foods?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Menu item name is required';
    }

    if (foodQuantities.size === 0) {
      newErrors.foods = 'Please select at least one default food item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const menuItemFoods = Array.from(foodQuantities.entries()).map(([foodId, quantity]) => ({
      food: foods.find((f) => f.id === foodId)!,
      quantity,
    }));

    const menuItemPossibleFoods = Array.from(possibleFoodQuantities.entries()).map(([foodId, quantity]) => ({
      food: foods.find((f) => f.id === foodId)!,
      quantity,
    }));

    const menuItemData = {
      name: name.trim(),
      restaurantId: restaurantId || '',
      foods: menuItemFoods,
      possibleFoods: menuItemPossibleFoods,
    };

    if (isEditMode && menuItemId) {
      updateMenuItem(menuItemId, menuItemData);
    } else {
      addMenuItem(menuItemData);
    }

    navigate(`/restaurants/${restaurantId}`);
  };

  const goBack = () => navigate(`/restaurants/${restaurantId}`);

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

        {/* Default Foods */}
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
            <div className="menu-item-form__food-list">
              {availableFoods.map((food) => {
                const isSelected = selectedFoodIds.has(food.id);
                const isPossible = selectedPossibleFoodIds.has(food.id);
                const qty = foodQuantities.get(food.id) || 1;
                return (
                  <div
                    key={food.id}
                    className={`menu-item-form__food-checkbox${isPossible ? ' menu-item-form__food-checkbox--dimmed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFoodSelection(food.id)}
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
                            updateFoodQuantity(food.id, parseInt(e.target.value) || 1)
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
          )}

          {errors.foods && <div className="form-field__error">{errors.foods}</div>}
        </div>

        {/* Possible Foods */}
        {availableFoods.length > 0 && (
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
                const isDefault = selectedFoodIds.has(food.id);
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

        {foodQuantities.size > 0 && (
          <div className="menu-item-form__summary">
            <h3 className="menu-item-form__summary-title">Nutrition Summary (Default Foods)</h3>
            <div className="menu-item-form__summary-grid">
              {(() => {
                const totals = Array.from(foodQuantities.entries()).reduce(
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

                return (
                  <>
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
                  </>
                );
              })()}
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
