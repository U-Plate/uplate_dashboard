import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { useSections } from '../contexts/SectionsContext';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { LocationPicker } from '../components/LocationPicker';
import '../components/LocationPicker.css';
import { Location } from '../constants';
import './RestaurantForm.css';

export const RestaurantForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addRestaurant, updateRestaurant, getRestaurantById } = useRestaurants();
  const { sections } = useSections();

  const [name, setName] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    sectionId?: string;
    location?: string;
  }>({});

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && id) {
      const restaurant = getRestaurantById(id);
      if (restaurant) {
        setName(restaurant.name);
        setSectionId(restaurant.sectionId);
        setLocation(restaurant.location);
      }
    } else if (sections.length > 0 && !sectionId) {
      setSectionId(sections[0].id);
    }
  }, [id, isEditMode, getRestaurantById, sections, sectionId]);

  const validate = (): boolean => {
    const newErrors: {
      name?: string;
      sectionId?: string;
      location?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Restaurant name is required';
    }

    if (!sectionId) {
      newErrors.sectionId = 'Section is required';
    }

    const hasCoords = location?.latitude != null && location?.longitude != null;
    const hasAddress = !!location?.address?.trim();
    if (!hasCoords && !hasAddress) {
      newErrors.location = 'Please enter an address or pick a location on the map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const restaurantData = {
      name: name.trim(),
      sectionId,
      location: location!,
    };

    if (isEditMode && id) {
      updateRestaurant(id, restaurantData);
    } else {
      addRestaurant(restaurantData);
    }

    navigate('/restaurants');
  };

  if (sections.length === 0) {
    return (
      <div className="restaurant-form">
        <div className="restaurant-form__empty">
          <h2>No Sections Available</h2>
          <p>You need to create at least one section before adding restaurants.</p>
          <Button onClick={() => navigate('/sections/new')}>Create Section</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-form">
      <div className="restaurant-form__header">
        <h1 className="restaurant-form__title">
          {isEditMode ? 'Edit Restaurant' : 'Create New Restaurant'}
        </h1>
      </div>

      <form className="restaurant-form__form" onSubmit={handleSubmit}>
        <FormField
          label="Restaurant Name"
          type="text"
          value={name}
          onChange={(value) => setName(value as string)}
          error={errors.name}
          required
          placeholder="e.g., Campus Café"
        />

        <div className="form-field">
          <label className="form-field__label">
            Section <span className="form-field__required"> *</span>
          </label>
          <select
            className={`form-field__input${errors.sectionId ? ' form-field__input--error' : ''}`}
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
          {errors.sectionId && <div className="form-field__error">{errors.sectionId}</div>}
        </div>

        <LocationPicker
          value={location}
          onChange={setLocation}
          error={errors.location}
        />

        <div className="restaurant-form__actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/restaurants')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditMode ? 'Update Restaurant' : 'Create Restaurant'}
          </Button>
        </div>
      </form>
    </div>
  );
};
