import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { useSections } from '../contexts/SectionsContext';
import { useFoods } from '../contexts/FoodContext';
import type { Column } from '../components/DataTable';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Food } from '../constants';
import './RestaurantDetailPage.css';

export const RestaurantDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getRestaurantById } = useRestaurants();
  const { getSectionById } = useSections();
  const { getFoodsByRestaurant, deleteFood } = useFoods();

  const [deleteFoodModalOpen, setDeleteFoodModalOpen] = useState(false);
  const [foodToDelete, setFoodToDelete] = useState<Food | null>(null);

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


    </div>
  );
};
