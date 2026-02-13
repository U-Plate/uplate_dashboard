import React from 'react';
import './DashboardTile.css';

interface DashboardTileProps {
    name: string;
    description: string;
    onClick: () => void;
}

const DashboardTile: React.FC<DashboardTileProps> = ({ name, description, onClick }) => {
    return (
        <div className="dashboard-tile" onClick={onClick}>
            <h2 className="dashboard-tile__name">{name}</h2>
            <p className="dashboard-tile__description">{description}</p>
        </div>
    );
};

export default DashboardTile;
