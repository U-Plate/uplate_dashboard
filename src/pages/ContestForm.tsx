import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { FormField } from '../components/FormField';
import { Button } from '../components/Button';

import './ContestForm.css';
import { useContests } from '../contexts/ContestsContext';

export const ContestForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addContest, updateContest, getContestById } = useContests();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
  }>({});

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && id) {
      const contest = getContestById(parseInt(id));
      if (contest) {
        setTitle(contest.title);
        setDescription(contest.description);
        setStartDate(contest.startDate.toISOString().slice(0, 16));
        setEndDate(contest.endDate.toISOString().slice(0, 16));
      }
    } 
  }, [id, isEditMode, getContestById]);

  const validate = (): boolean => {
    const newErrors: {
      name?: string;
      sectionId?: string;
      location?: string;
    } = {};

    if (!title.trim()) {
      newErrors.name = 'Contest title is required';
    }

    if (!description.trim()) {
      newErrors.name = 'Contest description is required';
    }

    if (!startDate) {
      newErrors.name = 'Start date is required';
    }

    if (!endDate) {
      newErrors.name = 'End date is required';
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.name = 'Start date must be before end date';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const contestData = {
      title: title.trim(),
      description: description.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    if (isEditMode && id) {
      await updateContest(parseInt(id), contestData);
    } else {
      await addContest(contestData);
    }

    navigate('/contests');
  };

  

  return (
    <div className="contest-form">
      <div className="contest-form__header">
        <h1 className="contest-form__title">
          {isEditMode ? 'Edit Contest' : 'Create New Contest'}
        </h1>
      </div>

      <form className="contest-form__form" onSubmit={handleSubmit}>
        <FormField
          label="Contest Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e as string)}
          error={errors.name}
          required
        />
        <FormField
          label="Description"
          type="textarea"
          value={description}
          onChange={(e) => setDescription(e as string)}
          error={errors.name}
          required
        />
        <FormField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e as string)}
          error={errors.name}
          required
        />
        <FormField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e as string)}
          error={errors.name}
          required
        />  

        <div className="contest-form__actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/contests')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditMode ? 'Update Contest' : 'Create Contest'}
          </Button>
        </div>
      </form>
    </div>
  );
};
