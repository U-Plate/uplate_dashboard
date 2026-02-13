import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFoods } from '../contexts/FoodContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import './FoodForm.css';

export const FoodForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: restaurantId, foodId } = useParams<{ id: string; foodId: string }>();
  const { addFood, updateFood, getFoodById } = useFoods();
  const { getRestaurantById } = useRestaurants();

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : undefined;

  const [formData, setFormData] = useState({
    name: '',
    restaurantId: restaurantId || '',
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
  });

  const [errors, setErrors] = useState<{ name?: string }>({});

  const isEditMode = !!foodId;

  useEffect(() => {
    if (isEditMode && foodId) {
      const food = getFoodById(foodId);
      if (food) {
        setFormData({
          name: food.name,
          restaurantId: food.restaurantId,
          quantity: food.quantity,
          servingSize: food.servingSize,
          ingredients: food.ingredients,
          calories: food.calories,
          caloriesFromFat: food.caloriesFromFat,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          saturatedFat: food.saturatedFat,
          sugar: food.sugar,
          addedSugars: food.addedSugars,
          sodium: food.sodium,
          dietaryFiber: food.dietaryFiber,
          cholesterol: food.cholesterol,
          calcium: food.calcium,
          iron: food.iron,
        });
      }
    }
  }, [foodId, isEditMode, getFoodById]);

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Food name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const foodData = {
      ...formData,
      restaurantId: restaurantId || '',
      name: formData.name.trim(),
    };

    if (isEditMode && foodId) {
      updateFood(foodId, foodData);
    } else {
      addFood(foodData);
    }

    navigate(`/restaurants/${restaurantId}`);
  };

  const goBack = () => navigate(`/restaurants/${restaurantId}`);

  return (
    <div className="food-form">
      <div className="food-form__header">
        <h1 className="food-form__title">
          {isEditMode ? 'Edit Food Item' : 'Create New Food Item'}
        </h1>
        {restaurant && (
          <p className="food-form__subtitle">for {restaurant.name}</p>
        )}
      </div>

      <form className="food-form__form" onSubmit={handleSubmit}>
        <div className="food-form__section">
          <h2 className="food-form__section-title">Basic Information</h2>

          <FormField
            label="Food Name"
            type="text"
            value={formData.name}
            onChange={(value) => updateField('name', value)}
            error={errors.name}
            required
            placeholder="e.g., Caesar Salad"
          />

          <FormField
            label="Serving Size"
            type="text"
            value={formData.servingSize}
            onChange={(value) => updateField('servingSize', value)}
            placeholder="e.g., 300g"
          />

          <FormField
            label="Ingredients"
            type="textarea"
            value={formData.ingredients}
            onChange={(value) => updateField('ingredients', value)}
            placeholder="List all ingredients..."
          />
        </div>

        <div className="food-form__section">
          <h2 className="food-form__section-title">Macronutrients</h2>

          <div className="food-form__grid">
            <FormField
              label="Calories (kcal)"
              type="number"
              value={formData.calories}
              onChange={(value) => updateField('calories', value)}
            />

            <FormField
              label="Calories from Fat (kcal)"
              type="number"
              value={formData.caloriesFromFat}
              onChange={(value) => updateField('caloriesFromFat', value)}
            />
          </div>

          <div className="food-form__grid">
            <FormField
              label="Protein (g)"
              type="number"
              value={formData.protein}
              onChange={(value) => updateField('protein', value)}
            />

            <FormField
              label="Carbohydrates (g)"
              type="number"
              value={formData.carbs}
              onChange={(value) => updateField('carbs', value)}
            />

            <FormField
              label="Fat (g)"
              type="number"
              value={formData.fat}
              onChange={(value) => updateField('fat', value)}
            />

            <FormField
              label="Saturated Fat (g)"
              type="number"
              value={formData.saturatedFat}
              onChange={(value) => updateField('saturatedFat', value)}
            />
          </div>

          <div className="food-form__grid">
            <FormField
              label="Sugar (g)"
              type="number"
              value={formData.sugar}
              onChange={(value) => updateField('sugar', value)}
            />

            <FormField
              label="Added Sugars (g)"
              type="number"
              value={formData.addedSugars}
              onChange={(value) => updateField('addedSugars', value)}
            />

            <FormField
              label="Dietary Fiber (g)"
              type="number"
              value={formData.dietaryFiber}
              onChange={(value) => updateField('dietaryFiber', value)}
            />

            <FormField
              label="Cholesterol (mg)"
              type="number"
              value={formData.cholesterol}
              onChange={(value) => updateField('cholesterol', value)}
            />
          </div>

          <FormField
            label="Sodium (mg)"
            type="number"
            value={formData.sodium}
            onChange={(value) => updateField('sodium', value)}
          />
        </div>

        <div className="food-form__section">
          <h2 className="food-form__section-title">Micronutrients</h2>

          <div className="food-form__grid">
            <FormField
              label="Calcium (mg)"
              type="number"
              value={formData.calcium}
              onChange={(value) => updateField('calcium', value)}
            />

            <FormField
              label="Iron (mg)"
              type="number"
              value={formData.iron}
              onChange={(value) => updateField('iron', value)}
            />
          </div>
        </div>

        <div className="food-form__actions">
          <Button type="button" variant="secondary" onClick={goBack}>
            Cancel
          </Button>
          <Button type="submit">{isEditMode ? 'Update Food Item' : 'Create Food Item'}</Button>
        </div>
      </form>
    </div>
  );
};
