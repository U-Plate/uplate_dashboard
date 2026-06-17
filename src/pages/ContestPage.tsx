import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Column } from '../components/DataTable';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';

import {  Contest, ContestParticipant } from '../constants';
import './ContestPage.css';
import { useContests } from '../contexts/ContestsContext';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

export const ContestPage: React.FC = () => {
  const navigate = useNavigate();
  const { getParticipants, getContestById, updateContest, deleteContest } = useContests();
  const { id } = useParams<{ id: string }>();
  const [participants, setParticipants] = useState<ContestParticipant[]>([]);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [minimumAppUsage, setMinimumAppUsage] = useState(0); // State to track minimum app usage for winner selection
  const [fromSchool, setFromSchool] = useState(''); // State to track school filter for winner selection
  const [hasToDownloadApp, setHasToDownloadApp] = useState(true); // State to track if winner must have downloaded the app
  const [contest, setContest] = useState<Contest>(); // State to hold the contest title

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStartDate, setEditedStartDate] = useState('');
  const [editedEndDate, setEditedEndDate] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);



  useEffect(() => {
    // Fetch participants for the contest when the component mounts
    const fetchParticipants = async () => {
      if (id && parseInt(id)) {
        if (parseInt(id)) {
          const data = await getParticipants(parseInt(id));
          setParticipants(data);
          const contestData = getContestById(parseInt(id));
          setContest(contestData);
        }
      }
    };

    fetchParticipants();
  }, [id, getParticipants, getContestById]);

  
  const handleSelectWinner = () => {
      // Filter participants based on minimum app usage and school
      const eligibleParticipants = participants.filter((p) => {
        const meetsAppUsage = p.daysUsedApp >= minimumAppUsage;
        const meetsSchool = fromSchool.length > 0 ? p.school.toLowerCase() === fromSchool.toLowerCase() : true;
        const meetsAppDownload = hasToDownloadApp ? p.joinState !== 'JustWebsite' : true;
        return meetsAppUsage && meetsSchool && meetsAppDownload;
      });

      if (eligibleParticipants.length === 0) {
        alert('No eligible participants found based on the criteria.');
        return;
      }

      // Randomly select a winner from the eligible participants
      const winner = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];
      alert(`The winner is: ${winner.contestantEmail} from ${winner.school}!`);
    setWinnerModalOpen(false);
    setFromSchool('');
    setMinimumAppUsage(0);
    setHasToDownloadApp(true);
  }

  const handleEditContest = () => {
    if (!contest) return;

    const updatedContest: Partial<Contest> = {
      title: editedTitle,
      description: editedDescription,
      startDate: editedStartDate ? new Date(editedStartDate) : undefined,
      endDate: editedEndDate ? new Date(editedEndDate) : undefined,
    };

    updateContest(contest.id, updatedContest);
    setEditModalOpen(false);
  };

  
const handleConfirmDelete = () => {
  if (contest) {
      deleteContest(contest.id);
      setDeleteModalOpen(false);
      navigate('/contests');


  }
};

const handleCopyLink = () => {
  if (contest) {
    const link = `https://contest.u-plate.com/${contest.id}`;
    navigator.clipboard.writeText(link)
      .then(() => alert('Contest link copied to clipboard!'))
      .catch(() => alert('Failed to copy link. Please try again.'));
  }
}
  

  const columns: Column<ContestParticipant>[] = [
    {
      header: 'Email',
      accessor: 'contestantEmail',
    },
    {
      header: 'Join Date',
      accessor: (row) => new Date(row.dayJoined).toLocaleDateString(),
    },
    {
      header: 'Days Opened App',
      accessor: 'daysUsedApp',
    },
    {
      header: 'Status',
      accessor: (row) => (row.joinState === 'JustWebsite' ? 'Just Website' : 'Downloaded App'),
    },
    {
      header: 'School',
      accessor: 'school',
    }
    
  ];

  return (
    <div className="contest-page">
       <div className="contest-detail__back">
              <Button variant="secondary" onClick={() => navigate('/contests')}>
                Back to Contests
              </Button>
            </div>
      
      <div className="contest-page__header">
        <div className="contest-page__heading">
          <p className="contest-page__eyebrow">Manage</p>
          <h1 className="contest-page__title">{contest?.title} Contest</h1>
          <p className="contest-page__subtitle">
            See all participants in this contest and select a winner
          </p>
        </div>
        <div className="contest-page__header-actions">
          
          <Button onClick={handleCopyLink}>Copy Join Link</Button>
          <Button onClick={() => setWinnerModalOpen(true)}>Select Winner</Button>
          <Button onClick={() => {
            setEditedTitle(contest?.title || '');
            setEditedDescription(contest?.description || '');
            setEditedStartDate(contest ? new Date(contest.startDate).toISOString().split('T')[0] : '');
            setEditedEndDate(contest ? new Date(contest.endDate).toISOString().split('T')[0] : '');
            setEditModalOpen(true);
          }}>Edit Contest</Button>
          <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>Delete Contest</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={participants}
       
        emptyMessage="No contest found. Create your first restaurant to get started."
      />

     
      <Modal
        isOpen={winnerModalOpen}
        onClose={() => setWinnerModalOpen(false)}
        title="Select Winner"
        onConfirm={handleSelectWinner}
        confirmText="Select"
        confirmVariant="primary"
      >
        <div className="modal__body-content">
          <Input 
            label="Minimum Days Opened App"
            type="number"
            value={minimumAppUsage.toString()}
            onChange={(value) => setMinimumAppUsage(parseInt(value))}
            placeholder="Default is 0 (no minimum)"
          />
         <br />
          
          <Input 
            label="From School (optional)"
            type="text"
            value={fromSchool}
            onChange={(value) => setFromSchool(value)}
            placeholder="Filter by school (leave blank for all)"
          />
          <br />

          <Input 
            label="Must Have Downloaded App"
            type="checkbox"
            value={hasToDownloadApp ? "true" : "false"}
            onChange={(value) => setHasToDownloadApp(value === "true")}
          />

        </div>  
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Contest"
        confirmText="Save Changes"
        confirmVariant="primary"
        onConfirm={handleEditContest}
      >
        <div className="modal__body-content">
          <Input 
            label="Contest Title"
            type="text"
            value={editedTitle}
            onChange={(value) => setEditedTitle(value)}
          />
          <br />
          <Input 
            label="Description"
            type="textarea"
            value={editedDescription}
            onChange={(value) => setEditedDescription(value)}
          />
          <br />
          <Input 
            label="Start Date"
            type="date"
            value={editedStartDate}
            onChange={(value) => setEditedStartDate(value)}
          />
          <br />
          <Input 
            label="End Date"
            type="date"
            value={editedEndDate}
            onChange={(value) => setEditedEndDate(value)}
          />
        </div>
      </Modal>  
      <Modal
              isOpen={deleteModalOpen}
              onClose={() => setDeleteModalOpen(false)}
              title="Delete Contest"
              onConfirm={handleConfirmDelete}
              confirmText="Delete"
              confirmVariant="danger"
            >
              {contest && (
                <p>
                  Are you sure you want to delete <strong>{contest.title}</strong>? This action cannot be undone.
                </p>
              )}
            </Modal>
     
    </div>
  );
};
