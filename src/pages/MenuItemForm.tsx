import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMenuItems } from '../contexts/MenuItemsContext';
import { useFoods } from '../contexts/FoodContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import type { MenuItemFood, MenuItemSize } from '../constants';
import { Food } from '../constants';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import './MenuItemForm.css';

interface FoodSelection {
  foodId: string;
  quantity: number;
}

interface SizeFormData {
  name: string;
  foods: FoodSelection[];
  possibleFoods: FoodSelection[];
}

const toMenuItemFoods = (
  selections: FoodSelection[],
  allFoods: Food[]
): MenuItemFood[] =>
  selections
    .map((s) => {
      const food = allFoods.find((f) => f.id === s.foodId);
      return food ? { food, quantity: s.quantity } : null;
    })
    .filter((x): x is MenuItemFood => x !== null);

const fromMenuItemFoods = (miFoods: MenuItemFood[]): FoodSelection[] =>
  miFoods.map((mf) => ({ foodId: mf.food.id, quantity: mf.quantity }));

export const MenuItemForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: restaurantId, menuItemId } = useParams<{
    id: string;
    menuItemId: string;
  }>();
  const { addMenuItem, updateMenuItem, getMenuItemById } = useMenuItems();
  const { getFoodsByRestaurant } = useFoods();
  const { getRestaurantById } = useRestaurants();

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : undefined;
  const restaurantFoods = restaurantId ? getFoodsByRestaurant(restaurantId) : [];

  const [name, setName] = useState('');
  const [useSizes, setUseSizes] = useState(false);
  const [foods, setFoods] = useState<FoodSelection[]>([]);
  const [possibleFoods, setPossibleFoods] = useState<FoodSelection[]>([]);
  const [sizes, setSizes] = useState<SizeFormData[]>([]);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const isEditMode = !!menuItemId;

  useEffect(() => {
    if (isEditMode && menuItemId) {
      const item = getMenuItemById(menuItemId);
      if (item) {
        setName(item.name);
        if (item.sizes && item.sizes.length > 0) {
          setUseSizes(true);
          setSizes(
            item.sizes.map((s) => ({
              name: s.name,
              foods: fromMenuItemFoods(s.foods),
              possibleFoods: fromMenuItemFoods(s.possibleFoods ?? []),
            }))
          );
        } else {
          setFoods(fromMenuItemFoods(item.foods));
          setPossibleFoods(fromMenuItemFoods(item.possibleFoods ?? []));
        }
      }
    }
  }, [menuItemId, isEditMode, getMenuItemById]);

  const selectedFoodIds = useMemo(
    () => new Set(foods.map((f) => f.foodId)),
    [foods]
  );

  const selectedPossibleIds = useMemo(
    () => new Set(possibleFoods.map((f) => f.foodId)),
    [possibleFoods]
  );

  const nutritionTotals = useMemo(() => {
    const source = useSizes && sizes.length > 0 ? sizes[0].foods : foods;
    return source.reduce(
      (totals, sel) => {
        const food = restaurantFoods.find((f) => f.id === sel.foodId);
        if (!food) return totals;
        return {
          calories: totals.calories + food.calories * sel.quantity,
          protein: totals.protein + food.protein * sel.quantity,
          carbs: totals.carbs + food.carbs * sel.quantity,
          fat: totals.fat + food.fat * sel.quantity,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [foods, sizes, useSizes, restaurantFoods]);

  const toggleFood = (foodId: string) => {
    if (selectedFoodIds.has(foodId)) {
      setFoods(foods.filter((f) => f.foodId !== foodId));
    } else {
      // Remove from possibleFoods if it was there
      setPossibleFoods(possibleFoods.filter((f) => f.foodId !== foodId));
      setFoods([...foods, { foodId, quantity: 1 }]);
    }
  };

  const togglePossibleFood = (foodId: string) => {
    if (selectedPossibleIds.has(foodId)) {
      setPossibleFoods(possibleFoods.filter((f) => f.foodId !== foodId));
    } else {
      // Remove from foods if it was there
      setFoods(foods.filter((f) => f.foodId !== foodId));
      setPossibleFoods([...possibleFoods, { foodId, quantity: 1 }]);
    }
  };

  const updateFoodQuantity = (foodId: string, quantity: number) => {
    setFoods(
      foods.map((f) => (f.foodId === foodId ? { ...f, quantity: Math.max(1, quantity) } : f))
    );
  };

  const updatePossibleFoodQuantity = (foodId: string, quantity: number) => {
    setPossibleFoods(
      possibleFoods.map((f) =>
        f.foodId === foodId ? { ...f, quantity: Math.max(1, quantity) } : f
      )
    );
  };

  // Size helpers
  const addSize = () => {
    setSizes([...sizes, { name: '', foods: [], possibleFoods: [] }]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSizeName = (index: number, newName: string) => {
    setSizes(sizes.map((s, i) => (i === index ? { ...s, name: newName } : s)));
  };

  const toggleSizeFood = (sizeIndex: number, foodId: string) => {
    setSizes(
      sizes.map((s, i) => {
        if (i !== sizeIndex) return s;
        const has = s.foods.some((f) => f.foodId === foodId);
        if (has) {
          return { ...s, foods: s.foods.filter((f) => f.foodId !== foodId) };
        }
        return {
          ...s,
          possibleFoods: s.possibleFoods.filter((f) => f.foodId !== foodId),
          foods: [...s.foods, { foodId, quantity: 1 }],
        };
      })
    );
  };

  const toggleSizePossibleFood = (sizeIndex: number, foodId: string) => {
    setSizes(
      sizes.map((s, i) => {
        if (i !== sizeIndex) return s;
        const has = s.possibleFoods.some((f) => f.foodId === foodId);
        if (has) {
          return { ...s, possibleFoods: s.possibleFoods.filter((f) => f.foodId !== foodId) };
        }
        return {
          ...s,
          foods: s.foods.filter((f) => f.foodId !== foodId),
          possibleFoods: [...s.possibleFoods, { foodId, quantity: 1 }],
        };
      })
    );
  };

  const updateSizeFoodQuantity = (sizeIndex: number, foodId: string, quantity: number) => {
    setSizes(
      sizes.map((s, i) =>
        i === sizeIndex
          ? {
              ...s,
              foods: s.foods.map((f) =>
                f.foodId === foodId ? { ...f, quantity: Math.max(1, quantity) } : f
              ),
            }
          : s
      )
    );
  };

  const updateSizePossibleFoodQuantity = (
    sizeIndex: number,
    foodId: string,
    quantity: number
  ) => {
    setSizes(
      sizes.map((s, i) =>
        i === sizeIndex
          ? {
              ...s,
              possibleFoods: s.possibleFoods.map((f) =>
                f.foodId === foodId ? { ...f, quantity: Math.max(1, quantity) } : f
              ),
            }
          : s
      )
    );
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

    if (useSizes) {
      const sizeData: MenuItemSize[] = sizes.map((s) => ({
        name: s.name,
        foods: toMenuItemFoods(s.foods, restaurantFoods),
        possibleFoods: toMenuItemFoods(s.possibleFoods, restaurantFoods),
      }));

      const data = {
        name: name.trim(),
        restaurantId: restaurantId || '',
        foods: [],
        possibleFoods: [],
        sizes: sizeData,
      };

      if (isEditMode && menuItemId) {
        updateMenuItem(menuItemId, data);
      } else {
        addMenuItem(data);
      }
    } else {
      const data = {
        name: name.trim(),
        restaurantId: restaurantId || '',
        foods: toMenuItemFoods(foods, restaurantFoods),
        possibleFoods: toMenuItemFoods(possibleFoods, restaurantFoods),
        sizes: [],
      };

      if (isEditMode && menuItemId) {
        updateMenuItem(menuItemId, data);
      } else {
        addMenuItem(data);
      }
    }

    navigate(`/restaurants/${restaurantId}`);
  };

  const goBack = () => navigate(`/restaurants/${restaurantId}`);

  const renderFoodCheckbox = (
    food: Food,
    isSelected: boolean,
    onToggle: () => void,
    quantity: number,
    onQuantityChange: (q: number) => void,
    isDimmed: boolean
  ) => (
    <label
      key={food.id}
      className={`menu-item-form__food-checkbox${isDimmed ? ' menu-item-form__food-checkbox--dimmed' : ''}`}
    >
      <input type="checkbox" checked={isSelected} onChange={onToggle} />
      <div className="menu-item-form__food-info">
        <span className="menu-item-form__food-name">{food.name}</span>
        <span className="menu-item-form__food-nutrition">
          {food.calories} cal | {food.protein}g protein | {food.carbs}g carbs |{' '}
          {food.fat}g fat
        </span>
      </div>
      {isSelected && (
        <div className="menu-item-form__food-quantity">
          <span className="menu-item-form__food-quantity-label">Qty:</span>
          <input
            type="number"
            className="menu-item-form__food-quantity-input"
            value={quantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
            min={1}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </label>
  );

  if (restaurantFoods.length === 0) {
    return (
      <div className="menu-item-form">
        <div className="menu-item-form__empty">
          <h2>No Food Items Available</h2>
          <p>
            You need to create food items for this restaurant before you can create
            menu items.
          </p>
          <Button onClick={() => navigate(`/restaurants/${restaurantId}/foods/new`)}>
            Add Food Item
          </Button>
        </div>
      </div>
    );
  }

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

        <div className="menu-item-form__sizes-toggle">
          <label className="menu-item-form__sizes-toggle-label">
            <input
              type="checkbox"
              checked={useSizes}
              onChange={(e) => {
                setUseSizes(e.target.checked);
                if (e.target.checked && sizes.length === 0) {
                  addSize();
                }
              }}
            />
            This menu item has multiple sizes
          </label>
        </div>

        {!useSizes ? (
          <>
            <h3>
              Default Foods{' '}
              <span className="menu-item-form__selected-count">
                ({foods.length} selected)
              </span>
            </h3>
            <p className="menu-item-form__section-hint">
              These foods are included by default in this menu item.
            </p>
            <div className="menu-item-form__food-list">
              {restaurantFoods.map((food) => {
                const sel = foods.find((f) => f.foodId === food.id);
                const isPossible = selectedPossibleIds.has(food.id);
                return renderFoodCheckbox(
                  food,
                  !!sel,
                  () => toggleFood(food.id),
                  sel?.quantity ?? 1,
                  (q) => updateFoodQuantity(food.id, q),
                  isPossible
                );
              })}
            </div>

            <h3>
              Possible Add-ons{' '}
              <span className="menu-item-form__selected-count">
                ({possibleFoods.length} selected)
              </span>
            </h3>
            <p className="menu-item-form__section-hint">
              Optional add-ons the customer can choose from.
            </p>
            <div className="menu-item-form__food-list">
              {restaurantFoods.map((food) => {
                const sel = possibleFoods.find((f) => f.foodId === food.id);
                const isDefault = selectedFoodIds.has(food.id);
                return renderFoodCheckbox(
                  food,
                  !!sel,
                  () => togglePossibleFood(food.id),
                  sel?.quantity ?? 1,
                  (q) => updatePossibleFoodQuantity(food.id, q),
                  isDefault
                );
              })}
            </div>
          </>
        ) : (
          <div className="menu-item-form__sizes-section">
            <div className="menu-item-form__sizes-header">
              <h3>Sizes ({sizes.length})</h3>
            </div>

            {sizes.map((size, sizeIdx) => {
              const sizeFoodIds = new Set(size.foods.map((f) => f.foodId));
              const sizePossibleIds = new Set(size.possibleFoods.map((f) => f.foodId));

              return (
                <div key={sizeIdx} className="menu-item-form__size-card">
                  <div className="menu-item-form__size-card-header">
                    <input
                      type="text"
                      className="menu-item-form__size-name-input"
                      placeholder="Size name (e.g., Regular, Large)"
                      value={size.name}
                      onChange={(e) => updateSizeName(sizeIdx, e.target.value)}
                    />
                    <Button
                      variant="danger"
                      onClick={() => removeSize(sizeIdx)}
                      disabled={sizes.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>

                  <h4>
                    Default Foods{' '}
                    <span className="menu-item-form__selected-count">
                      ({size.foods.length} selected)
                    </span>
                  </h4>
                  <div className="menu-item-form__food-list">
                    {restaurantFoods.map((food) => {
                      const sel = size.foods.find((f) => f.foodId === food.id);
                      return renderFoodCheckbox(
                        food,
                        !!sel,
                        () => toggleSizeFood(sizeIdx, food.id),
                        sel?.quantity ?? 1,
                        (q) => updateSizeFoodQuantity(sizeIdx, food.id, q),
                        sizePossibleIds.has(food.id)
                      );
                    })}
                  </div>

                  <h4>
                    Possible Add-ons{' '}
                    <span className="menu-item-form__selected-count">
                      ({size.possibleFoods.length} selected)
                    </span>
                  </h4>
                  <div className="menu-item-form__food-list">
                    {restaurantFoods.map((food) => {
                      const sel = size.possibleFoods.find((f) => f.foodId === food.id);
                      return renderFoodCheckbox(
                        food,
                        !!sel,
                        () => toggleSizePossibleFood(sizeIdx, food.id),
                        sel?.quantity ?? 1,
                        (q) => updateSizePossibleFoodQuantity(sizeIdx, food.id, q),
                        sizeFoodIds.has(food.id)
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <Button variant="secondary" onClick={addSize}>
              Add Size
            </Button>
          </div>
        )}

        <div className="menu-item-form__summary">
          <h3 className="menu-item-form__summary-title">Nutrition Summary</h3>
          <div className="menu-item-form__summary-grid">
            <div className="menu-item-form__summary-item">
              <span className="menu-item-form__summary-label">Calories</span>
              <span className="menu-item-form__summary-value">
                {nutritionTotals.calories} kcal
              </span>
            </div>
            <div className="menu-item-form__summary-item">
              <span className="menu-item-form__summary-label">Protein</span>
              <span className="menu-item-form__summary-value">
                {nutritionTotals.protein}g
              </span>
            </div>
            <div className="menu-item-form__summary-item">
              <span className="menu-item-form__summary-label">Carbs</span>
              <span className="menu-item-form__summary-value">
                {nutritionTotals.carbs}g
              </span>
            </div>
            <div className="menu-item-form__summary-item">
              <span className="menu-item-form__summary-label">Fat</span>
              <span className="menu-item-form__summary-value">
                {nutritionTotals.fat}g
              </span>
            </div>
          </div>
        </div>

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
