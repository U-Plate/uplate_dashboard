import React, { useState, useRef, useEffect } from 'react';
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
import { parseCSV, readFileAsText } from '../utils/csvParser';
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
  const { getFoodsByRestaurant, deleteFood, addFoods, updateFood } = useFoods();
  const { getMenuItemsByRestaurant, deleteMenuItem, deleteAllMenuItems } = useMenuItems();

  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [deleteFoodModalOpen, setDeleteFoodModalOpen] = useState(false);
  const [foodToDelete, setFoodToDelete] = useState<Food | null>(null);
  const [deleteMenuItemModalOpen, setDeleteMenuItemModalOpen] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
  const [deleteAllMenuItemsModalOpen, setDeleteAllMenuItemsModalOpen] = useState(false);
  const [deleteAllFoodsModalOpen, setDeleteAllFoodsModalOpen] = useState(false);
  const [migrateModalOpen, setMigrateModalOpen] = useState(false);
  const [migrateNutrient, setMigrateNutrient] = useState('');
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());
  const [foodItemsCollapsed, setFoodItemsCollapsed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'o') {
        e.preventDefault();
        if (id) {
          window.scrollTo(0, 0);
          navigate(`/restaurants/${id}/menu-items/new`);
        }
      }
      if (e.metaKey && e.key === '0') {
        e.preventDefault();
        if (id) {
          window.scrollTo(0, 0);
          navigate(`/restaurants/${id}/menu-items/quick-add`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [id, navigate]);

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

  const handleDeleteFood = (food: Food, e: React.MouseEvent) => {
    if (e.shiftKey) {
      deleteFood(food.id);
    } else {
      setFoodToDelete(food);
      setDeleteFoodModalOpen(true);
    }
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

  const confirmDeleteAllMenuItems = () => {
    deleteAllMenuItems(restaurant.id);
    setDeleteAllMenuItemsModalOpen(false);
  };

  const confirmDeleteAllFoods = () => {
    for (const food of restaurantFoods) {
      deleteFood(food.id);
    }
    setDeleteAllFoodsModalOpen(false);
  };

  const NUTRIENT_OPTIONS = [
    { key: 'calories', label: 'Calories' },
    { key: 'caloriesFromFat', label: 'Calories from Fat' },
    { key: 'protein', label: 'Protein' },
    { key: 'carbs', label: 'Carbs' },
    { key: 'fat', label: 'Fat' },
    { key: 'saturatedFat', label: 'Saturated Fat' },
    { key: 'sugar', label: 'Sugar' },
    { key: 'addedSugars', label: 'Added Sugars' },
    { key: 'sodium', label: 'Sodium' },
    { key: 'dietaryFiber', label: 'Dietary Fiber' },
    { key: 'cholesterol', label: 'Cholesterol' },
    { key: 'calcium', label: 'Calcium' },
    { key: 'iron', label: 'Iron' },
  ];

  const confirmMigrate = () => {
    if (!migrateNutrient) return;
    for (const food of restaurantFoods) {
      updateFood(food.id, { [migrateNutrient]: -1 });
    }
    setMigrateModalOpen(false);
    setMigrateNutrient('');
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

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    try {
      const text = await readFileAsText(file);
      const parsed = parseCSV(text);
      await addFoods(parsed.map((foodData) => ({ ...foodData, restaurantId: restaurant.id })));
      setImportStatus(`Imported ${parsed.length} food item${parsed.length !== 1 ? 's' : ''}`);
    } catch {
      setImportStatus('Failed to import CSV');
    }

    if (csvInputRef.current) csvInputRef.current.value = '';
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
    { header: 'Labels', accessor: (row) => (Array.isArray(row.labels) ? row.labels : []).join(', ') },
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
          <h2
            className="restaurant-detail__section-title restaurant-detail__section-title--collapsible"
            onClick={() => setFoodItemsCollapsed(!foodItemsCollapsed)}
          >
            <span className={`restaurant-detail__collapse-arrow ${foodItemsCollapsed ? 'restaurant-detail__collapse-arrow--collapsed' : ''}`}>&#9662;</span>
            Food Items ({restaurantFoods.length})
          </h2>
          {!foodItemsCollapsed && (
            <div className="restaurant-detail__section-header-actions">
              <Button onClick={() => csvInputRef.current?.click()}>
                Import CSV
              </Button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCSVImport}
              />
              <Button onClick={() => navigate(`/restaurants/${restaurant.id}/foods/new`)}>
                Add Food Item
              </Button>
              {restaurantFoods.length > 0 && (
                <>
                  <Button onClick={() => setMigrateModalOpen(true)}>
                    Migrate Nutrient
                  </Button>
                  <Button variant="danger" onClick={() => setDeleteAllFoodsModalOpen(true)}>
                    Delete All Foods
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {!foodItemsCollapsed && (
          <>
            {importStatus && (
              <div className="restaurant-detail__import-status">
                {importStatus}
                <button
                  className="restaurant-detail__import-status-close"
                  onClick={() => setImportStatus(null)}
                >
                  &times;
                </button>
              </div>
            )}

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
                  <Button variant="danger" onClick={(e) => handleDeleteFood(row, e)}>
                    Delete
                  </Button>
                </div>
              )}
              emptyMessage="No food items yet. Add your first food item for this restaurant."
            />
          </>
        )}
      </div>

      {/* Menu Items Section */}
      <div className="restaurant-detail__section">
        <div className="restaurant-detail__section-header">
          <h2 className="restaurant-detail__section-title">
            Menu Items ({restaurantMenuItems.length})
          </h2>
          <Button onClick={() => navigate(`/restaurants/${restaurant.id}/menu-items/quick-add`)}>
            Quick Add Menu Item
          </Button>
          <Button onClick={() => navigate(`/restaurants/${restaurant.id}/menu-items/new`)}>
            Add Menu Item
          </Button>
          {restaurantMenuItems.length > 0 && (
            <Button variant="danger" onClick={() => setDeleteAllMenuItemsModalOpen(true)}>
              Delete All Menu Items
            </Button>
          )}
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
                                        <span className="restaurant-detail__optional-badge">optional</span>
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
                                      <span className="restaurant-detail__optional-badge">optional</span>
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

      {/* Delete All Foods Modal */}
      <Modal
        isOpen={deleteAllFoodsModalOpen}
        onClose={() => setDeleteAllFoodsModalOpen(false)}
        title="Delete All Food Items"
        onConfirm={confirmDeleteAllFoods}
        confirmText="Delete All"
        confirmVariant="danger"
      >
        <p>
          Are you sure you want to delete all <strong>{restaurantFoods.length}</strong> food
          item{restaurantFoods.length !== 1 ? 's' : ''} from this restaurant? This action cannot be
          undone.
        </p>
      </Modal>

      {/* Migrate Nutrient Modal */}
      <Modal
        isOpen={migrateModalOpen}
        onClose={() => { setMigrateModalOpen(false); setMigrateNutrient(''); }}
        title="Migrate Nutrient to -1"
        onConfirm={confirmMigrate}
        confirmText="Migrate"
        confirmVariant="danger"
      >
        <p>
          Select a nutrient to set to <strong>-1</strong> for all{' '}
          <strong>{restaurantFoods.length}</strong> food item
          {restaurantFoods.length !== 1 ? 's' : ''} in this restaurant.
        </p>
        <select
          value={migrateNutrient}
          onChange={(e) => setMigrateNutrient(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Select a nutrient...</option>
          {NUTRIENT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </Modal>

      {/* Delete All Menu Items Modal */}
      <Modal
        isOpen={deleteAllMenuItemsModalOpen}
        onClose={() => setDeleteAllMenuItemsModalOpen(false)}
        title="Delete All Menu Items"
        onConfirm={confirmDeleteAllMenuItems}
        confirmText="Delete All"
        confirmVariant="danger"
      >
        <p>
          Are you sure you want to delete all <strong>{restaurantMenuItems.length}</strong> menu
          item{restaurantMenuItems.length !== 1 ? 's' : ''} from this restaurant? This action cannot be
          undone.
        </p>
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
