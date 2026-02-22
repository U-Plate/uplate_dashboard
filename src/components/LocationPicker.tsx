import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '../constants';

// Fix leaflet default marker icons broken by bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  value: Location | null;
  onChange: (location: Location | null) => void;
  error?: string;
}

// Default center: Purdue University
const DEFAULT_CENTER: [number, number] = [40.4237, -86.9212];
const DEFAULT_ZOOM = 15;

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, error }) => {
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Determine current mode
  const hasCoords = value?.latitude != null && value?.longitude != null;
  const hasAddress = !!value?.address?.trim();

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!text) {
      onChange(null);
    } else {
      onChange(new Location({ address: text }));
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    onChange(new Location({ latitude: lat, longitude: lng }));
    // Clear address input visually
    if (addressInputRef.current) {
      addressInputRef.current.value = '';
    }
  };

  const handleClearMap = () => {
    onChange(null);
  };

  // Keep address input in sync when value changes externally (e.g. edit mode load)
  useEffect(() => {
    if (addressInputRef.current) {
      addressInputRef.current.value = value?.address ?? '';
    }
  }, [value?.address]);

  const markerPosition: [number, number] | null =
    hasCoords ? [value!.latitude!, value!.longitude!] : null;

  return (
    <div className="location-picker">
      <label className="form-field__label">
        Location <span className="form-field__required"> *</span>
      </label>

      <div className="location-picker__address">
        <input
          ref={addressInputRef}
          className={`form-field__input${error && !hasCoords ? ' form-field__input--error' : ''}`}
          type="text"
          placeholder="e.g., 400 N McCutcheon Drive, West Lafayette, IN 47906"
          defaultValue={value?.address ?? ''}
          onChange={handleAddressChange}
          disabled={hasCoords}
        />
      </div>

      <div className="location-picker__divider">
        <span>or pick on map</span>
      </div>

      <div className={`location-picker__map-wrap${error && !hasAddress ? ' location-picker__map-wrap--error' : ''}`}>
        <MapContainer
          center={markerPosition ?? DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="location-picker__map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />
          {markerPosition && <Marker position={markerPosition} />}
        </MapContainer>
      </div>

      {hasCoords && (
        <div className="location-picker__coords">
          <span>
            Lat: {value!.latitude!.toFixed(6)}, Long: {value!.longitude!.toFixed(6)}
          </span>
          <button type="button" className="location-picker__clear" onClick={handleClearMap}>
            Clear pin
          </button>
        </div>
      )}

      {error && <div className="form-field__error">{error}</div>}
    </div>
  );
};
