import React from 'react';
import './DashboardTile.css';

interface DashboardTileProps {
    name: string;
    description: string;
    onClick: () => void;
    icon?: React.ReactNode;
    meta?: React.ReactNode;
}

const DashboardTile: React.FC<DashboardTileProps> = ({ name, description, onClick, icon, meta }) => {
    return (
        <button type="button" className="dashboard-tile" onClick={onClick}>
            {icon && <div className="dashboard-tile__icon" aria-hidden="true">{icon}</div>}
            <div className="dashboard-tile__body">
                <h2 className="dashboard-tile__name">{name}</h2>
                <p className="dashboard-tile__description">{description}</p>
                {meta && <div className="dashboard-tile__meta">{meta}</div>}
            </div>
            <span className="dashboard-tile__chevron" aria-hidden="true">&rarr;</span>
        </button>
    );
};

export default DashboardTile;
