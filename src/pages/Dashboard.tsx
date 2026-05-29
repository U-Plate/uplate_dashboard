import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTile from '../components/DashboardTile';
import { useSections } from '../contexts/SectionsContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { hasAdminKey, setAdminKey, clearAdminKey } from '../utils/adminKey';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [keySet, setKeySet] = useState(() => hasAdminKey());
  const [input, setInput] = useState('');
  const [showChange, setShowChange] = useState(false);
  const { sections } = useSections();
  const { restaurants } = useRestaurants();
  const { feedback } = useFeedback();
  const unhandledCount = feedback.filter((f) => !f.handled).length;

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
      <div className="dashboard-page dashboard-page--locked">
        <div className="dashboard-lock-card">
          <div className="dashboard-lock-card__badge" aria-hidden="true">UP</div>
          <h1 className="dashboard-lock-card__title">Welcome to UPlate</h1>
          <p className="dashboard-lock-card__subtitle">
            {showChange ? 'Enter a new admin key to continue.' : 'Enter your admin key to access the dashboard.'}
          </p>
          <form className="dashboard-key-form" onSubmit={handleKeySubmit}>
            <label className="dashboard-key-label" htmlFor="admin-key">
              Admin key
            </label>
            <input
              id="admin-key"
              type="password"
              className="dashboard-key-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter admin key"
              autoFocus
            />
            <div className="dashboard-key-row">
              <button type="submit" className="dashboard-key-btn">
                {showChange ? 'Update key' : 'Unlock dashboard'}
              </button>
              {showChange && (
                <button
                  type="button"
                  className="dashboard-key-btn dashboard-key-btn--secondary"
                  onClick={() => setShowChange(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="dashboard-hero__eyebrow">Dashboard</p>
          <h1 className="dashboard-hero__title">Welcome back</h1>
          <p className="dashboard-hero__subtitle">
            Manage campus sections, restaurants, and menus from one place.
          </p>
        </div>
        <div className="dashboard-hero__stats">
          <div className="dashboard-stat">
            <span className="dashboard-stat__value">{sections.length}</span>
            <span className="dashboard-stat__label">Sections</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__value">{restaurants.length}</span>
            <span className="dashboard-stat__label">Restaurants</span>
          </div>
          <div
            className={`dashboard-stat${unhandledCount > 0 ? ' dashboard-stat--alert' : ''}`}
          >
            <span className="dashboard-stat__value">{unhandledCount}</span>
            <span className="dashboard-stat__label">Unhandled feedback</span>
          </div>
        </div>
      </header>

      <section className="dashboard-tiles" aria-label="Manage">
        <DashboardTile
          name="Sections"
          description="Group restaurants by campus areas, dining halls, or zones."
          onClick={() => navigate('/sections')}
          icon={<span>&#x25A6;</span>}
          meta={`${sections.length} total`}
        />
        <DashboardTile
          name="Restaurants"
          description="Browse, edit, and add restaurants along with their menus."
          onClick={() => navigate('/restaurants')}
          icon={<span>&#x2691;</span>}
          meta={`${restaurants.length} total`}
        />
        <DashboardTile
          name="Feedback"
          description="Triage incoming feedback from students and partners."
          onClick={() => navigate('/feedback')}
          icon={<span>&#x2709;</span>}
          meta={
            unhandledCount === 0
              ? `${feedback.length} total · all handled`
              : `${unhandledCount} unhandled · ${feedback.length} total`
          }
        />
      </section>

      <footer className="dashboard-footer">
        <div className="dashboard-key-actions">
          <button className="dashboard-key-link" onClick={() => setShowChange(true)}>
            Change admin key
          </button>
          <span className="dashboard-key-sep">·</span>
          <button className="dashboard-key-link" onClick={handleClearKey}>
            Sign out
          </button>
        </div>
      </footer>
    </div>
  );
};
