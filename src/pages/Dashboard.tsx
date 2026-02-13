import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTile from '../components/DashboardTile';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

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
    </div>
  );
};
