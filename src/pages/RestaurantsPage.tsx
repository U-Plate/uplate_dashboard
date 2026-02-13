import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { useSections } from '../contexts/SectionsContext';
import { useFoods } from '../contexts/FoodContext';
import { useMenuItems } from '../contexts/MenuItemsContext';
import type { Column } from '../components/DataTable';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Restaurant } from '../constants';
import './RestaurantsPage.css';

export const RestaurantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurants, deleteRestaurant, moveRestaurantToSection } = useRestaurants();
  const { sections, getSectionById } = useSections();
  const { foods } = useFoods();
  const { menuItems } = useMenuItems();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);
  const [restaurantToMove, setRestaurantToMove] = useState<Restaurant | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('all');

  const handleDeleteClick = (restaurant: Restaurant) => {
    setRestaurantToDelete(restaurant);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (restaurantToDelete) {
      deleteRestaurant(restaurantToDelete.id);
      setDeleteModalOpen(false);
      setRestaurantToDelete(null);
    }
  };

  const handleMoveClick = (restaurant: Restaurant) => {
    setRestaurantToMove(restaurant);
    setSelectedSectionId(restaurant.sectionId);
    setMoveModalOpen(true);
  };

  const handleConfirmMove = () => {
    if (restaurantToMove && selectedSectionId) {
      moveRestaurantToSection(restaurantToMove.id, selectedSectionId);
      setMoveModalOpen(false);
      setRestaurantToMove(null);
      setSelectedSectionId('');
    }
  };

  const getFoodCount = (restaurantId: string) => {
    return foods.filter((f) => f.restaurantId === restaurantId).length;
  };

  const getMenuItemCount = (restaurantId: string) => {
    return menuItems.filter((m) => m.restaurantId === restaurantId).length;
  };

  const filteredRestaurants =
    filterSectionId === 'all'
      ? restaurants
      : restaurants.filter((r) => r.sectionId === filterSectionId);

  const columns: Column<Restaurant>[] = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Section',
      accessor: (row) => getSectionById(row.sectionId)?.name || 'No Section',
    },
    {
      header: 'Location',
      accessor: (row) => `${row.location.latitude.toFixed(4)}, ${row.location.longitude.toFixed(4)}`,
    },
    {
      header: 'Food Items',
      accessor: (row) => getFoodCount(row.id),
    },
  ];

  return (
    <div className="restaurants-page">
      <div className="restaurants-page__header">
        <h1 className="restaurants-page__title">Restaurants</h1>
        <div className="restaurants-page__header-actions">
          <select
            className="restaurants-page__filter"
            value={filterSectionId}
            onChange={(e) => setFilterSectionId(e.target.value)}
          >
            <option value="all">All Sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
          <Button onClick={() => navigate('/restaurants/new')}>Create New Restaurant</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRestaurants}
        onRowClick={(row) => navigate(`/restaurants/${row.id}`)}
        actions={(row) => (
          <div className="restaurants-page__actions">
            <Button variant="secondary" onClick={() => navigate(`/restaurants/${row.id}/edit`)}>
              Edit
            </Button>
            <Button variant="secondary" onClick={() => handleMoveClick(row)}>
              Move
            </Button>
            <Button variant="danger" onClick={() => handleDeleteClick(row)}>
              Delete
            </Button>
          </div>
        )}
        emptyMessage="No restaurants found. Create your first restaurant to get started."
      />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Restaurant"
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        confirmVariant="danger"
      >
        {restaurantToDelete && (
          <p>
            Are you sure you want to delete <strong>{restaurantToDelete.name}</strong>?
            <br />
            <br />
            This restaurant has:
            <ul>
              <li>{getFoodCount(restaurantToDelete.id)} food item(s)</li>
              <li>{getMenuItemCount(restaurantToDelete.id)} menu item(s)</li>
            </ul>
            All associated food items and menu items will also be deleted.
          </p>
        )}
      </Modal>

      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title="Move Restaurant to Section"
        onConfirm={handleConfirmMove}
        confirmText="Move"
      >
        {restaurantToMove && (
          <div>
            <p>
              Move <strong>{restaurantToMove.name}</strong> to a different section:
            </p>
            <select
              className="restaurants-page__move-select"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Modal>
    </div>
  );
};
