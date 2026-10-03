import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { InternApplication } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getSampleInternApplications } from '../utils/sampleData';
import { USE_API } from '../config';
import { internApplicationsApi } from '../api/internApplications';

interface InternApplicationsContextType {
  applications: InternApplication[];
  loading: boolean;
  markReviewed: (id: string) => void | Promise<void>;
  unmarkReviewed: (id: string) => void | Promise<void>;
  toggleReviewed: (id: string) => void | Promise<void>;
}

const InternApplicationsContext = createContext<InternApplicationsContextType | undefined>(undefined);

const reviveApplications = (data: unknown): InternApplication[] => {
  if (!Array.isArray(data)) return [];
  return data.map((a) => new InternApplication(a as InternApplication));
};

const LocalInternApplicationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [applications, setApplications] = useLocalStorage<InternApplication[]>(
    'uplate_intern_applications',
    getSampleInternApplications(),
    reviveApplications,
  );

  const setReviewedFor = (id: string, reviewed: boolean) => {
    setApplications(
      applications.map((a) =>
        a.id === id ? new InternApplication({ ...a, reviewed }) : a,
      ),
    );
  };

  const markReviewed = (id: string) => setReviewedFor(id, true);
  const unmarkReviewed = (id: string) => setReviewedFor(id, false);
  const toggleReviewed = (id: string) => {
    const current = applications.find((a) => a.id === id);
    if (!current) return;
    setReviewedFor(id, !current.reviewed);
  };

  return (
    <InternApplicationsContext.Provider
      value={{ applications, loading: false, markReviewed, unmarkReviewed, toggleReviewed }}
    >
      {children}
    </InternApplicationsContext.Provider>
  );
};

const ApiInternApplicationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [applications, setApplications] = useState<InternApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    internApplicationsApi
      .getAll()
      .then((data) => setApplications(data))
      .catch((err) => {
        console.error('Failed to load intern applications:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const markReviewed = async (id: string) => {
    const optimistic = applications.map((a) =>
      a.id === id ? new InternApplication({ ...a, reviewed: true }) : a,
    );
    setApplications(optimistic);
    try {
      const updated = await internApplicationsApi.markReviewed(id);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('markReviewed failed:', err);
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? new InternApplication({ ...a, reviewed: false }) : a)),
      );
      throw err;
    }
  };

  const unmarkReviewed = async (id: string) => {
    const optimistic = applications.map((a) =>
      a.id === id ? new InternApplication({ ...a, reviewed: false }) : a,
    );
    setApplications(optimistic);
    try {
      const updated = await internApplicationsApi.unmarkReviewed(id);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('unmarkReviewed failed:', err);
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? new InternApplication({ ...a, reviewed: true }) : a)),
      );
      throw err;
    }
  };

  const toggleReviewed = (id: string) => {
    const current = applications.find((a) => a.id === id);
    if (!current) return Promise.resolve();
    return current.reviewed ? unmarkReviewed(id) : markReviewed(id);
  };

  return (
    <InternApplicationsContext.Provider
      value={{ applications, loading, markReviewed, unmarkReviewed, toggleReviewed }}
    >
      {children}
    </InternApplicationsContext.Provider>
  );
};

export const InternApplicationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiInternApplicationsProvider>{children}</ApiInternApplicationsProvider>
  ) : (
    <LocalInternApplicationsProvider>{children}</LocalInternApplicationsProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useInternApplications = (): InternApplicationsContextType => {
  const context = useContext(InternApplicationsContext);
  if (!context) {
    throw new Error('useInternApplications must be used within an InternApplicationsProvider');
  }
  return context;
};
