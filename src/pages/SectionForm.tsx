import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSections } from '../contexts/SectionsContext';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import './SectionForm.css';

export const SectionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addSection, updateSection, getSectionById } = useSections();

  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && id) {
      const section = getSectionById(id);
      if (section) {
        setName(section.name);
      }
    }
  }, [id, isEditMode, getSectionById]);

  const validate = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Section name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (isEditMode && id) {
      updateSection(id, { name: name.trim() });
    } else {
      addSection({ name: name.trim() });
    }

    navigate('/sections');
  };

  return (
    <div className="section-form">
      <div className="section-form__header">
        <h1 className="section-form__title">
          {isEditMode ? 'Edit Section' : 'Create New Section'}
        </h1>
      </div>

      <form className="section-form__form" onSubmit={handleSubmit}>
        <FormField
          label="Section Name"
          type="text"
          value={name}
          onChange={(value) => setName(value as string)}
          error={errors.name}
          required
          placeholder="e.g., North Campus"
        />

        <div className="section-form__actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/sections')}>
            Cancel
          </Button>
          <Button type="submit">{isEditMode ? 'Update Section' : 'Create Section'}</Button>
        </div>
      </form>
    </div>
  );
};
