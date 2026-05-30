import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Column } from '../components/DataTable';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Contest } from '../constants';
import './ContestsPage.css';
import { useContests } from '../contexts/ContestsContext';

export const ContestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { contests, deleteContest } = useContests();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState<Contest | null>(null);

  const handleDeleteClick = (contest: Contest) => {
    setContestToDelete(contest);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contestToDelete) {
      deleteContest(contestToDelete.id);
      setDeleteModalOpen(false);
      setContestToDelete(null);
    }
  };

  const handleCopyContestLink = (contest: Contest) => {
  if (contest) {
    const link = `https://contest.u-plate.com/${contest.id}`;
    navigator.clipboard.writeText(link)
      .then(() => alert('Contest link copied to clipboard!'))
      .catch(() => alert('Failed to copy link. Please try again.'));
  }
}

  const columns: Column<Contest>[] = [
    {
      header: 'Title',
      accessor: 'title',
    },
    {
      header: 'Start Date',
      accessor: (row) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      header: 'End Date',
      accessor: (row) =>
        new Date(row.endDate).toLocaleDateString(),
    },
    
  ];

  return (
    <div className="contests-page">
      <div className="contests-page__header">
        <div className="contests-page__heading">
          <p className="contests-page__eyebrow">Manage</p>
          <h1 className="contests-page__title">Contests</h1>
          <p className="contests-page__subtitle">
            Create and manage contests to engage your customers and boost sales.
          </p>
        </div>
        <div className="contests-page__header-actions">
          
          <Button onClick={() => navigate('/contests/new')}>+ New Contest</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={contests}
        onRowClick={(row) => navigate(`/contests/${row.id}`)}
        actions={(row) => (
          <div className="contests-page__actions">
           <Button onClick={() => handleCopyContestLink(row)}>
              Copy Join Link
            </Button>
            <Button variant="danger" onClick={() => handleDeleteClick(row)}>
              Delete
            </Button>
            
          </div>
        )}
        emptyMessage="No contest found. Create your first contest to get started."
      />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Contest"
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        confirmVariant="danger"
      >
        {contestToDelete && (
          <p>
            Are you sure you want to delete <strong>{contestToDelete.title}</strong>? This action cannot be undone.
          </p>
        )}
      </Modal>

     
    </div>
  );
};
