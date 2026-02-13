import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

export const Navigation: React.FC = () => {
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
        </ul>
      </div>
    </nav>
  );
};
