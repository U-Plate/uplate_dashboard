import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { useSections } from '../contexts/SectionsContext';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { LocationPicker } from '../components/LocationPicker';
import '../components/LocationPicker.css';
import { Location } from '../constants';
import './RestaurantForm.css';

/** Matches the backend's own ceiling in `restaurants/logos.ts`. */
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

/**
 * The logo picker. Staged rather than immediate: it hands the chosen file back
 * and the surrounding form uploads it on save, so a logo can't land on a
 * restaurant whose other edits were then abandoned.
 */
const LogoField: React.FC<{
  /** The logo already published for this restaurant, if any. */
  currentUrl: string | null;
  file: File | null;
  onFile: (file: File | null) => void;
  removed: boolean;
  onRemovedChange: (removed: boolean) => void;
  error?: string;
  disabled?: boolean;
}> = ({ currentUrl, file, onFile, removed, onRemovedChange, error, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived from the file rather than held in state, so picking one doesn't
  // cost a second render. An object URL is a handle on the file, not a copy, so
  // the effect exists purely to revoke it — otherwise the blob stays in memory
  // for the life of the page.
  const stagedPreview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    if (!stagedPreview) return;
    return () => URL.revokeObjectURL(stagedPreview);
  }, [stagedPreview]);

  const shown = stagedPreview ?? (removed ? null : currentUrl);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] ?? null;
    // Reset the input so re-picking the same file after a validation error
    // still fires a change event.
    e.target.value = '';
    if (!chosen) return;
    onRemovedChange(false);
    onFile(chosen);
  };

  return (
    <div className="form-field">
      <label className="form-field__label">Logo</label>
      <div className="logo-field">
        <div className="logo-field__preview">
          {shown ? (
            <img src={shown} alt="" className="logo-field__image" />
          ) : (
            <span className="logo-field__placeholder">No logo</span>
          )}
        </div>

        <div className="logo-field__controls">
          <input
            ref={inputRef}
            className="logo-field__input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            onChange={pick}
            disabled={disabled}
          />
          <div className="logo-field__buttons">
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {shown ? 'Replace image' : 'Choose image'}
            </Button>
            {shown && (
              <Button
                variant="danger"
                disabled={disabled}
                onClick={() => {
                  onFile(null);
                  // Only a *published* logo needs removing on save; discarding
                  // a staged file just puts the current one back.
                  onRemovedChange(!!currentUrl);
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <div className="logo-field__hint">
            {file
              ? `${file.name} — uploads when you save.`
              : removed
                ? 'The current logo will be deleted when you save.'
                : 'Shown next to this restaurant in the app’s Retail list. PNG, JPEG, WebP, AVIF or GIF, up to 5 MB.'}
          </div>
        </div>
      </div>
      {error && <div className="form-field__error">{error}</div>}
    </div>
  );
};

export const RestaurantForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    addRestaurant,
    updateRestaurant,
    getRestaurantById,
    uploadRestaurantLogo,
    removeRestaurantLogo,
  } = useRestaurants();
  const { sections } = useSections();

  const [name, setName] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [hidden, setHidden] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    sectionId?: string;
    location?: string;
    logo?: string;
    save?: string;
  }>({});

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && id) {
      const restaurant = getRestaurantById(id);
      if (restaurant) {
        setName(restaurant.name);
        setSectionId(restaurant.sectionId);
        setLocation(restaurant.location);
        setHidden(restaurant.hidden);
        setCurrentLogo(restaurant.logo);
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
      logo?: string;
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

    // Checked here as well as on the server so an oversized file fails before
    // the user waits out the upload of it.
    if (logoFile && logoFile.size > MAX_LOGO_BYTES) {
      newErrors.logo = `That image is ${(logoFile.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || saving) {
      return;
    }

    const restaurantData = {
      name: name.trim(),
      sectionId,
      location: location!,
      hidden,
    };

    setSaving(true);
    try {
      // The logo is a second request either way: on create there's no id to
      // upload against until the restaurant exists, and on update the image
      // travels as raw bytes rather than as a field of the JSON body.
      let restaurantId = id;
      if (isEditMode && id) {
        await updateRestaurant(id, restaurantData);
      } else {
        const created = await addRestaurant(restaurantData);
        restaurantId = created.id;
      }

      if (restaurantId) {
        if (logoFile) {
          await uploadRestaurantLogo(restaurantId, logoFile);
        } else if (logoRemoved && currentLogo) {
          await removeRestaurantLogo(restaurantId);
        }
      }

      navigate('/restaurants');
    } catch (err) {
      // The restaurant itself may well have saved — say what failed rather
      // than navigating away as if everything worked.
      setErrors((prev) => ({
        ...prev,
        save: err instanceof Error ? err.message : 'Something went wrong saving this restaurant.',
      }));
      setSaving(false);
    }
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

        <LogoField
          currentUrl={currentLogo}
          file={logoFile}
          onFile={setLogoFile}
          removed={logoRemoved}
          onRemovedChange={setLogoRemoved}
          error={errors.logo}
          disabled={saving}
        />

        <LocationPicker
          value={location}
          onChange={setLocation}
          error={errors.location}
        />

        <div className="form-field">
          <label className="form-field__label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
            />
            Hidden
          </label>
          <div className="form-field__hint" style={{ color: '#666', fontSize: '0.85rem' }}>
            Hidden restaurants are not visible to users in the app.
          </div>
        </div>

        {errors.save && <div className="form-field__error">{errors.save}</div>}

        <div className="restaurant-form__actions">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => navigate('/restaurants')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? 'Saving…'
              : isEditMode
                ? 'Update Restaurant'
                : 'Create Restaurant'}
          </Button>
        </div>
      </form>
    </div>
  );
};
