import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFeedback } from '../contexts/FeedbackContext';
import { useFoodPhotos } from '../contexts/FoodPhotosContext';
import { useInternApplications } from '../contexts/InternApplicationsContext';
import { FoodPhotoStatus } from '../constants';
import './Navigation.css';

export const Navigation: React.FC = () => {
  const { feedback } = useFeedback();
  const unhandledCount = feedback.filter((f) => !f.handled).length;
  const { applications } = useInternApplications();
  const unreviewedCount = applications.filter((a) => !a.reviewed).length;
  const { photos } = useFoodPhotos();
  const pendingPhotoCount = photos.filter(
    (p) => p.status === FoodPhotoStatus.Pending,
  ).length;

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <div className="navigation__brand">
          <h2 className="navigation__logo">UPlate</h2>
        </div>
        <ul className="navigation__list">
          <li className="navigation__item">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
              end
            >
              Dashboard
            </NavLink>
          </li>
          <li className="navigation__item">
            <NavLink
              to="/sections"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
            >
              Sections
            </NavLink>
          </li>
          <li className="navigation__item">
            <NavLink
              to="/restaurants"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
            >
              Restaurants
            </NavLink>
          </li>
          <li className="navigation__item">
            <NavLink
              to="/restaurant-accounts"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
            >
              Accounts
            </NavLink>
          </li>
            <li className="navigation__item">
            <NavLink
              to="/contests"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
            >
              Contests
            </NavLink>
          </li>
          <li className="navigation__item">
            <NavLink
              to="/feedback"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
            >
              <span>Feedback</span>
              {unhandledCount > 0 && (
                <span
                  className="navigation__badge"
                  aria-label={`${unhandledCount} unhandled`}
                >
                  {unhandledCount > 99 ? '99+' : unhandledCount}
                </span>
              )}
            </NavLink>
          </li>
          <li className="navigation__item">
            <NavLink
              to="/food-photos"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
            >
              <span>Photos</span>
              {pendingPhotoCount > 0 && (
                <span
                  className="navigation__badge"
                  aria-label={`${pendingPhotoCount} awaiting review`}
                >
                  {pendingPhotoCount > 99 ? '99+' : pendingPhotoCount}
                </span>
              )}
            </NavLink>
          </li>
          <li className="navigation__item">
            <NavLink
              to="/applicants"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
            >
              <span>Applicants</span>
              {unreviewedCount > 0 && (
                <span
                  className="navigation__badge"
                  aria-label={`${unreviewedCount} unreviewed`}
                >
                  {unreviewedCount > 99 ? '99+' : unreviewedCount}
                </span>
              )}
            </NavLink>
          </li>
          <li className="navigation__item">
            <NavLink
              to="/broadcast"
              className={({ isActive }) =>
                `navigation__link${isActive ? ' navigation__link--active' : ''}`
              }
            >
              Broadcast
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};
