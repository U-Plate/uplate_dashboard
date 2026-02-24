import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTile from '../components/DashboardTile';
import { hasAdminKey, setAdminKey, clearAdminKey } from '../utils/adminKey';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [keySet, setKeySet] = useState(() => hasAdminKey());
  const [input, setInput] = useState('');
  const [showChange, setShowChange] = useState(false);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setAdminKey(input.trim());
    setKeySet(true);
    setShowChange(false);
    setInput('');
  };

  const handleClearKey = () => {
    clearAdminKey();
    setKeySet(false);
    setShowChange(false);
  };

  if (!keySet || showChange) {
    return (
      <div className="dashboard-page">
        <h1 className="dashboard-title">UPlate Dashboard</h1>
        <form className="dashboard-key-form" onSubmit={handleKeySubmit}>
          <label className="dashboard-key-label" htmlFor="admin-key">
            {showChange ? 'Enter a new admin key' : 'Enter admin key to continue'}
          </label>
          <div className="dashboard-key-row">
            <input
              id="admin-key"
              type="password"
              className="dashboard-key-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin key"
              autoFocus
            />
            <button type="submit" className="dashboard-key-btn">
              {showChange ? 'Update' : 'Unlock'}
            </button>
            {showChange && (
              <button type="button" className="dashboard-key-btn dashboard-key-btn--secondary" onClick={() => setShowChange(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">UPlate Dashboard</h1>
      <div className="dashboard-tiles">
        <DashboardTile
          name="Sections"
          description="Manage campus sections and areas."
          onClick={() => navigate('/sections')}
        />
        <DashboardTile
          name="Restaurants"
          description="Manage restaurants and their locations."
          onClick={() => navigate('/restaurants')}
        />
      </div>
      <div className="dashboard-key-actions">
        <button className="dashboard-key-link" onClick={() => setShowChange(true)}>Change key</button>
        <span className="dashboard-key-sep">·</span>
        <button className="dashboard-key-link" onClick={handleClearKey}>Clear key</button>
      </div>
    </div>
  );
};
