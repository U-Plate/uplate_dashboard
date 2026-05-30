import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Contest, ContestParticipant } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { getSampleContestParticipants, getSampleContests } from '../utils/sampleData';
import { USE_API } from '../config';

import { contestsApi } from '../api/contests';

interface ContestsContextType {
  contests: Contest[];
  addContest: (contest: Omit<Contest, 'id'>) => void | Promise<void>;
  updateContest: (id: number, updates: Partial<Contest>) => void | Promise<void>;
  deleteContest: (id: number) => void | Promise<void>;
  getContestById: (id: number) => Contest | undefined;
  getParticipants: (contestId: number) => Promise<ContestParticipant[]>;

}

const ContestsContext = createContext<ContestsContextType | undefined>(undefined);

const LocalContestsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contests, setContests] = useLocalStorage<Contest[]>(
    'uplate_contests',
    getSampleContests()
  );

  const addContest = (data: Omit<Contest, 'id'>) => {
    const newContest = new Contest({ id: generateId(), ...data });
    setContests([...contests, newContest]);
  };

  const updateContest = (id: number, updates: Partial<Contest>) => {
    setContests(
      contests.map((r) =>
        r.id === id ? new Contest({ ...r, ...updates }) : r
      )
    );
  };

  const deleteContest = (id: number) => {
    setContests(contests.filter((r) => r.id !== id));
  };

  const getContestById = (id: number) => contests.find((r) => r.id === id);

  const getParticipants = async (contestId: number) => {
    const participants: ContestParticipant[] = getSampleContestParticipants();
    return participants.filter((p) => p.contestId === contestId);
  }


  return (
    <ContestsContext.Provider
      value={{
        contests,
        addContest,
        updateContest,
        deleteContest,
        getContestById,
        getParticipants,

      }}
    >
      {children}
    </ContestsContext.Provider>
  );
};

const ApiContestsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contests, setContests] = useState<Contest[]>([]);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    contestsApi.getAll().then(setContests);
  }, []);

  const addContest = async (data: Omit<Contest, 'id'>) => {
    const created = await contestsApi.create(data);
    setContests((prev) => [...prev, created]);
  };

  const updateContest = async (id: number, updates: Partial<Contest>) => {
    const updated = await contestsApi.update(id, updates);
    setContests((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const deleteContest = async (id: number) => {
    await contestsApi.delete(id);
    setContests((prev) => prev.filter((r) => r.id !== id));
  };

  const getContestById = (id: number) => {
    console.log("Getting contest by ID:", id);
    console.log("Current contests in state:", contests);
    return contests.find((r) => r.id === id); };

  const getParticipants = async (contestId: number) => {
    return await contestsApi.getParticipants(contestId);  
  }

  return (
    <ContestsContext.Provider
      value={{
        contests,
        addContest,
        updateContest,
        deleteContest,
        getContestById,
        getParticipants,
      }}
    >
      {children}
    </ContestsContext.Provider>
  );
};

export const ContestsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiContestsProvider>{children}</ApiContestsProvider>
  ) : (
    <LocalContestsProvider>{children}</LocalContestsProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useContests = (): ContestsContextType => {
  const context = useContext(ContestsContext);
  if (!context) {
    throw new Error('useContests must be used within a ContestsProvider');
  }
  return context;
};
