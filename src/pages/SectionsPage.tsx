import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSections } from '../contexts/SectionsContext';
import { useRestaurants } from '../contexts/RestaurantsContext';
import type { Column } from '../components/DataTable';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Section } from '../constants';
import './SectionsPage.css';

export const SectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sections, deleteSection } = useSections();
  const { restaurants } = useRestaurants();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  const getRestaurantCount = (sectionId: string) => {
    return restaurants.filter((r) => r.sectionId === sectionId).length;
  };

  const handleDeleteClick = (section: Section) => {
    setSectionToDelete(section);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sectionToDelete) {
      deleteSection(sectionToDelete.id);
      setDeleteModalOpen(false);
      setSectionToDelete(null);
    }
  };

  const columns: Column<Section>[] = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Restaurants',
      accessor: (row) => getRestaurantCount(row.id),
    },
  ];

  const sectionHasRestaurants =
    sectionToDelete != null && getRestaurantCount(sectionToDelete.id) > 0;

  return (
    <div className="sections-page">
      <div className="sections-page__header">
        <h1 className="sections-page__title">Sections</h1>
        <Button onClick={() => navigate('/sections/new')}>Create New Section</Button>
      </div>

      <DataTable
        columns={columns}
        data={sections}
        actions={(row) => (
          <div className="sections-page__actions">
            <Button variant="secondary" onClick={() => navigate(`/sections/${row.id}/edit`)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => handleDeleteClick(row)}>
              Delete
            </Button>
          </div>
        )}
        emptyMessage="No sections found. Create your first section to get started."
      />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Section"
        onConfirm={sectionHasRestaurants ? undefined : handleConfirmDelete}
        confirmText="Delete"
        confirmVariant="danger"
        cancelText={sectionHasRestaurants ? 'Close' : 'Cancel'}
      >
        {sectionToDelete && (
          sectionHasRestaurants ? (
            <p>
              <strong>{sectionToDelete.name}</strong> cannot be deleted because it still has{' '}
              {getRestaurantCount(sectionToDelete.id)} restaurant(s) assigned to it. Move or
              delete those restaurants first.
            </p>
          ) : (
            <p>
              Are you sure you want to delete <strong>{sectionToDelete.name}</strong>?
            </p>
          )
        )}
      </Modal>
    </div>
  );
};
