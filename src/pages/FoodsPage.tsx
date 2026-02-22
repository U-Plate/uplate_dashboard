import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFoods } from '../contexts/FoodContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import type { Column } from '../components/DataTable';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Food } from '../constants';
import './FoodsPage.css';

export const FoodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { foods, deleteFood } = useFoods();
  const { restaurants, getRestaurantById } = useRestaurants();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [foodToDelete, setFoodToDelete] = useState<Food | null>(null);
  const [filterRestaurantId, setFilterRestaurantId] = useState('all');

  const handleDeleteClick = (food: Food) => {
    setFoodToDelete(food);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (foodToDelete) {
      deleteFood(foodToDelete.id);
      setDeleteModalOpen(false);
      setFoodToDelete(null);
    }
  };

  const filteredFoods =
    filterRestaurantId === 'all'
      ? foods
      : foods.filter((f) => f.restaurantId === filterRestaurantId);

  const columns: Column<Food>[] = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Restaurant',
      accessor: (row) => getRestaurantById(row.restaurantId)?.name || 'Unknown',
    },
    {
      header: 'Calories',
      accessor: 'calories',
    },
    {
      header: 'Protein (g)',
      accessor: 'protein',
    },
    {
      header: 'Carbs (g)',
      accessor: 'carbs',
    },
    {
      header: 'Fat (g)',
      accessor: 'fat',
    },
  ];

  return (
    <div className="foods-page">
      <div className="foods-page__header">
        <h1 className="foods-page__title">Food Items</h1>
        <div className="foods-page__header-actions">
          <select
            className="foods-page__filter"
            value={filterRestaurantId}
            onChange={(e) => setFilterRestaurantId(e.target.value)}
          >
            <option value="all">All Restaurants</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
          <Button onClick={() => navigate('/foods/new')}>Create New Food Item</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredFoods}
        actions={(row) => (
          <div className="foods-page__actions">
            <Button variant="secondary" onClick={() => navigate(`/foods/${row.id}/edit`)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => handleDeleteClick(row)}>
              Delete
            </Button>
          </div>
        )}
        emptyMessage="No food items found. Create your first food item to get started."
      />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Food Item"
        onConfirm={handleConfirmDelete}
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
