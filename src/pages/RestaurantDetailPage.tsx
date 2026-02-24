import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { useSections } from '../contexts/SectionsContext';
import { useFoods } from '../contexts/FoodContext';
import type { Column } from '../components/DataTable';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import type { MenuItemFood } from '../constants';
import { Food, MenuItem } from '../constants';
import { useMenuItems } from '../contexts/MenuItemsContext';
import './RestaurantDetailPage.css';

const getNutritionTotals = (foods: MenuItemFood[]) =>
  foods.reduce(
    (totals, mf) => ({
      calories: totals.calories + mf.food.calories * mf.quantity,
      protein: totals.protein + mf.food.protein * mf.quantity,
      carbs: totals.carbs + mf.food.carbs * mf.quantity,
      fat: totals.fat + mf.food.fat * mf.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

export const RestaurantDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getRestaurantById } = useRestaurants();
  const { getSectionById } = useSections();
  const { getFoodsByRestaurant, deleteFood } = useFoods();
  const { getMenuItemsByRestaurant, deleteMenuItem } = useMenuItems();

  const [deleteFoodModalOpen, setDeleteFoodModalOpen] = useState(false);
  const [foodToDelete, setFoodToDelete] = useState<Food | null>(null);
  const [deleteMenuItemModalOpen, setDeleteMenuItemModalOpen] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());

  const restaurant = id ? getRestaurantById(id) : undefined;

  if (!restaurant) {
    return (
      <div className="restaurant-detail">
        <div className="restaurant-detail__not-found">
          <h2>Restaurant Not Found</h2>
          <p>The restaurant you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/restaurants')}>Back to Restaurants</Button>
        </div>
      </div>
    );
  }

  const section = getSectionById(restaurant.sectionId);
  const restaurantFoods = getFoodsByRestaurant(restaurant.id);
  const restaurantMenuItems = getMenuItemsByRestaurant(restaurant.id);

  const handleDeleteFood = (food: Food) => {
    setFoodToDelete(food);
    setDeleteFoodModalOpen(true);
  };

  const confirmDeleteFood = () => {
    if (foodToDelete) {
      deleteFood(foodToDelete.id);
      setDeleteFoodModalOpen(false);
      setFoodToDelete(null);
    }
  };

  const handleDeleteMenuItem = (menuItem: MenuItem) => {
    setMenuItemToDelete(menuItem);
    setDeleteMenuItemModalOpen(true);
  };

  const confirmDeleteMenuItem = () => {
    if (menuItemToDelete) {
      deleteMenuItem(menuItemToDelete.id);
      setDeleteMenuItemModalOpen(false);
      setMenuItemToDelete(null);
    }
  };

  const toggleExpandMenuItem = (menuItemId: string) => {
    const newExpanded = new Set(expandedMenuItems);
    if (newExpanded.has(menuItemId)) {
      newExpanded.delete(menuItemId);
    } else {
      newExpanded.add(menuItemId);
    }
    setExpandedMenuItems(newExpanded);
  };

  const hasSizes = (menuItem: MenuItem) => menuItem.sizes && menuItem.sizes.length > 0;

  const totalFoodCount = (menuItem: MenuItem) => {
    if (hasSizes(menuItem)) {
      return menuItem.sizes.reduce((sum, s) => sum + s.foods.length + (s.possibleFoods?.length || 0), 0);
    }
    return menuItem.foods.length + (menuItem.possibleFoods?.length || 0);
  };

  const foodColumns: Column<Food>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Calories', accessor: 'calories' },
    { header: 'Protein (g)', accessor: 'protein' },
    { header: 'Carbs (g)', accessor: 'carbs' },
    { header: 'Fat (g)', accessor: 'fat' },
    { header: 'Serving Size', accessor: 'servingSize' },
  ];

  return (
    <div className="restaurant-detail">
      <div className="restaurant-detail__back">
        <Button variant="secondary" onClick={() => navigate('/restaurants')}>
          Back to Restaurants
        </Button>
      </div>

      <div className="restaurant-detail__info">
        <h1 className="restaurant-detail__name">{restaurant.name}</h1>
        <div className="restaurant-detail__meta">
          <span className="restaurant-detail__section">
            Section: {section?.name || 'No Section'}
          </span>
          <span className="restaurant-detail__location">
            {restaurant.location.latitude != null && restaurant.location.longitude != null
              ? `Coords: ${restaurant.location.latitude.toFixed(6)}, ${restaurant.location.longitude.toFixed(6)}`
              : `Address: ${restaurant.location.address ?? '—'}`}
          </span>
        </div>
      </div>

      {/* Food Items Section */}
      <div className="restaurant-detail__section">
        <div className="restaurant-detail__section-header">
          <h2 className="restaurant-detail__section-title">
            Food Items ({restaurantFoods.length})
          </h2>
          <Button onClick={() => navigate(`/restaurants/${restaurant.id}/foods/new`)}>
            Add Food Item
          </Button>
        </div>

        <DataTable
          columns={foodColumns}
          data={restaurantFoods}
          actions={(row) => (
            <div className="restaurant-detail__actions">
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`/restaurants/${restaurant.id}/foods/${row.id}/edit`)
                }
              >
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDeleteFood(row)}>
                Delete
              </Button>
            </div>
          )}
          emptyMessage="No food items yet. Add your first food item for this restaurant."
        />
      </div>

      {/* Menu Items Section */}
      <div className="restaurant-detail__section">
        <div className="restaurant-detail__section-header">
          <h2 className="restaurant-detail__section-title">
            Menu Items ({restaurantMenuItems.length})
          </h2>
          <Button onClick={() => navigate(`/restaurants/${restaurant.id}/menu-items/new`)}>
            Add Menu Item
          </Button>
        </div>

        {restaurantMenuItems.length === 0 ? (
          <div className="restaurant-detail__empty">
            No menu items yet. Add your first menu item for this restaurant.
          </div>
        ) : (
          <div className="restaurant-detail__menu-items">
            {restaurantMenuItems.map((menuItem) => {
              const withSizes = hasSizes(menuItem);
              const primaryFoods = withSizes ? menuItem.sizes[0].foods : menuItem.foods;
              const totals = getNutritionTotals(primaryFoods);
              const isExpanded = expandedMenuItems.has(menuItem.id);

              return (
                <div key={menuItem.id} className="restaurant-detail__menu-card">
                  <div className="restaurant-detail__menu-card-header">
                    <div className="restaurant-detail__menu-card-info">
                      <h3 className="restaurant-detail__menu-card-name">{menuItem.name}</h3>
                      <div className="restaurant-detail__menu-card-nutrition">
                        <span>{totals.calories} cal</span>
                        <span>{totals.protein}g protein</span>
                        <span>{totals.carbs}g carbs</span>
                        <span>{totals.fat}g fat</span>
                      </div>
                    </div>
                    <div className="restaurant-detail__menu-card-actions">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          navigate(
                            `/restaurants/${restaurant.id}/menu-items/${menuItem.id}/edit`
                          )
                        }
                      >
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteMenuItem(menuItem)}>
                        Delete
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => toggleExpandMenuItem(menuItem.id)}
                      >
                        {isExpanded ? 'Hide' : 'Show'} Foods ({totalFoodCount(menuItem)})
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="restaurant-detail__menu-card-foods">
                      {withSizes ? (
                        menuItem.sizes.map((size) => (
                          <div key={size.name}>
                            <h4 className="restaurant-detail__food-list-heading">{size.name}</h4>
                            <ul className="restaurant-detail__food-list">
                              {size.foods.map((mf) => (
                                <li key={`${size.name}-${mf.food.id}`} className="restaurant-detail__food-list-item">
                                  <span className="restaurant-detail__food-list-name">
                                    {mf.food.name}
                                    {mf.quantity > 1 && (
                                      <span className="restaurant-detail__food-list-qty">
                                        {' '}x{mf.quantity}
                                      </span>
                                    )}
                                  </span>
                                  <span className="restaurant-detail__food-list-nutrition">
                                    {mf.food.calories * mf.quantity} cal | {mf.food.protein * mf.quantity}g protein | {mf.food.carbs * mf.quantity}g carbs | {mf.food.fat * mf.quantity}g fat
                                  </span>
                                </li>
                              ))}
                            </ul>
                            {size.possibleFoods?.length > 0 && (
                              <>
                                <h4 className="restaurant-detail__food-list-heading restaurant-detail__food-list-heading--possible">
                                  Possible Add-ons
                                </h4>
                                <ul className="restaurant-detail__food-list">
                                  {size.possibleFoods.map((mf) => (
                                    <li key={`${size.name}-possible-${mf.food.id}`} className="restaurant-detail__food-list-item restaurant-detail__food-list-item--possible">
                                      <span className="restaurant-detail__food-list-name">
                                        {mf.food.name}
                                        {mf.quantity > 1 && (
                                          <span className="restaurant-detail__food-list-qty">
                                            {' '}x{mf.quantity}
                                          </span>
                                        )}
                                      </span>
                                      <span className="restaurant-detail__food-list-nutrition">
                                        {mf.food.calories * mf.quantity} cal | {mf.food.protein * mf.quantity}g protein | {mf.food.carbs * mf.quantity}g carbs | {mf.food.fat * mf.quantity}g fat
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        ))
                      ) : (
                        <>
                          <h4 className="restaurant-detail__food-list-heading">Default Foods</h4>
                          <ul className="restaurant-detail__food-list">
                            {menuItem.foods.map((mf) => (
                              <li key={mf.food.id} className="restaurant-detail__food-list-item">
                                <span className="restaurant-detail__food-list-name">
                                  {mf.food.name}
                                  {mf.quantity > 1 && (
                                    <span className="restaurant-detail__food-list-qty">
                                      {' '}x{mf.quantity}
                                    </span>
                                  )}
                                </span>
                                <span className="restaurant-detail__food-list-nutrition">
                                  {mf.food.calories * mf.quantity} cal | {mf.food.protein * mf.quantity}g protein | {mf.food.carbs * mf.quantity}g carbs | {mf.food.fat * mf.quantity}g fat
                                </span>
                              </li>
                            ))}
                          </ul>
                          {menuItem.possibleFoods?.length > 0 && (
                            <>
                              <h4 className="restaurant-detail__food-list-heading restaurant-detail__food-list-heading--possible">
                                Possible Add-ons
                              </h4>
                              <ul className="restaurant-detail__food-list">
                                {menuItem.possibleFoods.map((mf) => (
                                  <li key={mf.food.id} className="restaurant-detail__food-list-item restaurant-detail__food-list-item--possible">
                                    <span className="restaurant-detail__food-list-name">
                                      {mf.food.name}
                                      {mf.quantity > 1 && (
                                        <span className="restaurant-detail__food-list-qty">
                                          {' '}x{mf.quantity}
                                        </span>
                                      )}
                                    </span>
                                    <span className="restaurant-detail__food-list-nutrition">
                                      {mf.food.calories * mf.quantity} cal | {mf.food.protein * mf.quantity}g protein | {mf.food.carbs * mf.quantity}g carbs | {mf.food.fat * mf.quantity}g fat
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Food Modal */}
      <Modal
        isOpen={deleteFoodModalOpen}
        onClose={() => setDeleteFoodModalOpen(false)}
        title="Delete Food Item"
        onConfirm={confirmDeleteFood}
        confirmText="Delete"
        confirmVariant="danger"
      >
        {foodToDelete && (
          <p>Are you sure you want to delete <strong>{foodToDelete.name}</strong>?</p>
        )}
      </Modal>

      {/* Delete Menu Item Modal */}
      <Modal
        isOpen={deleteMenuItemModalOpen}
        onClose={() => setDeleteMenuItemModalOpen(false)}
        title="Delete Menu Item"
        onConfirm={confirmDeleteMenuItem}
        confirmText="Delete"
        confirmVariant="danger"
      >
        {menuItemToDelete && (
          <p>
            Are you sure you want to delete <strong>{menuItemToDelete.name}</strong>? This menu
            item contains {menuItemToDelete.foods.length} food item(s).
          </p>
        )}
      </Modal>
    </div>
  );
};
