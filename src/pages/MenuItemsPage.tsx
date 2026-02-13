import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenuItems } from '../contexts/MenuItemsContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { MenuItem } from '../constants';
import './MenuItemsPage.css';

export const MenuItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { menuItems, deleteMenuItem } = useMenuItems();
  const { restaurants, getRestaurantById } = useRestaurants();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
  const [filterRestaurantId, setFilterRestaurantId] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleDeleteClick = (menuItem: MenuItem) => {
    setMenuItemToDelete(menuItem);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (menuItemToDelete) {
      deleteMenuItem(menuItemToDelete.id);
      setDeleteModalOpen(false);
      setMenuItemToDelete(null);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredMenuItems =
    filterRestaurantId === 'all'
      ? menuItems
      : menuItems.filter((m) => m.restaurantId === filterRestaurantId);

  const getTotalNutrition = (menuItem: MenuItem) => {
    return menuItem.foods.reduce(
      (totals, mf) => ({
        calories: totals.calories + mf.food.calories * mf.quantity,
        protein: totals.protein + mf.food.protein * mf.quantity,
        carbs: totals.carbs + mf.food.carbs * mf.quantity,
        fat: totals.fat + mf.food.fat * mf.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <div className="menu-items-page">
      <div className="menu-items-page__header">
        <h1 className="menu-items-page__title">Menu Items</h1>
        <div className="menu-items-page__header-actions">
          <select
            className="menu-items-page__filter"
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
          <Button onClick={() => navigate('/menu-items/new')}>Create New Menu Item</Button>
        </div>
      </div>

      {filteredMenuItems.length === 0 ? (
        <div className="menu-items-page__empty">
          No menu items found. Create your first menu item to get started.
        </div>
      ) : (
        <div className="menu-items-page__list">
          {filteredMenuItems.map((menuItem) => {
            const totals = getTotalNutrition(menuItem);
            const isExpanded = expandedItems.has(menuItem.id);

            return (
              <div key={menuItem.id} className="menu-item-card">
                <div className="menu-item-card__header">
                  <div className="menu-item-card__info">
                    <h3 className="menu-item-card__name">{menuItem.name}</h3>
                    <p className="menu-item-card__restaurant">
                      {getRestaurantById(menuItem.restaurantId)?.name || 'Unknown Restaurant'}
                    </p>
                  </div>
                  <div className="menu-item-card__nutrition">
                    <span>{totals.calories} cal</span>
                    <span>{totals.protein}g protein</span>
                    <span>{totals.carbs}g carbs</span>
                    <span>{totals.fat}g fat</span>
                  </div>
                  <div className="menu-item-card__actions">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/menu-items/${menuItem.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteClick(menuItem)}>
                      Delete
                    </Button>
                    <Button variant="secondary" onClick={() => toggleExpand(menuItem.id)}>
                      {isExpanded ? 'Hide' : 'Show'} Foods ({menuItem.foods.length})
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="menu-item-card__foods">
                    <h4 className="menu-item-card__foods-title">Included Foods:</h4>
                    <ul className="menu-item-card__foods-list">
                      {menuItem.foods.map((mf) => (
                        <li key={mf.food.id} className="menu-item-card__food-item">
                          <span className="menu-item-card__food-name">
                            {mf.food.name}{mf.quantity > 1 ? ` x${mf.quantity}` : ''}
                          </span>
                          <span className="menu-item-card__food-nutrition">
                            {mf.food.calories * mf.quantity} cal | {mf.food.protein * mf.quantity}g protein | {mf.food.carbs * mf.quantity}g carbs |{' '}
                            {mf.food.fat * mf.quantity}g fat
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Menu Item"
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        confirmVariant="danger"
      >
        {menuItemToDelete && (
          <p>
            Are you sure you want to delete <strong>{menuItemToDelete.name}</strong>?
            <br />
            <br />
            This menu item contains {menuItemToDelete.foods.length} food item(s) and will be
            permanently removed.
          </p>
        )}
      </Modal>
    </div>
  );
};
