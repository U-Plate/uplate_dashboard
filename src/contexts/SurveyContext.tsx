import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { SwitcherSurveyResponse } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getSampleSurveys } from '../utils/sampleData';
import { USE_API } from '../config';
import { switcherSurveyApi } from '../api/switcherSurvey';

interface SurveyContextType {
  surveys: SwitcherSurveyResponse[];
  loading: boolean;
  markReviewed: (id: string) => void | Promise<void>;
  unmarkReviewed: (id: string) => void | Promise<void>;
  toggleReviewed: (id: string) => void | Promise<void>;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

const reviveSurveys = (data: unknown): SwitcherSurveyResponse[] => {
  if (!Array.isArray(data)) return [];
  return data.map((s) => new SwitcherSurveyResponse(s as SwitcherSurveyResponse));
};

const LocalSurveyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [surveys, setSurveys] = useLocalStorage<SwitcherSurveyResponse[]>(
    'uplate_switcher_surveys',
    getSampleSurveys(),
    reviveSurveys,
  );

  const setReviewedFor = (id: string, reviewed: boolean) => {
    setSurveys(
      surveys.map((s) =>
        s.id === id ? new SwitcherSurveyResponse({ ...s, reviewed }) : s,
      ),
    );
  };

  const markReviewed = (id: string) => setReviewedFor(id, true);
  const unmarkReviewed = (id: string) => setReviewedFor(id, false);
  const toggleReviewed = (id: string) => {
    const current = surveys.find((s) => s.id === id);
    if (!current) return;
    setReviewedFor(id, !current.reviewed);
  };

  return (
    <SurveyContext.Provider
      value={{ surveys, loading: false, markReviewed, unmarkReviewed, toggleReviewed }}
    >
      {children}
    </SurveyContext.Provider>
  );
};

const ApiSurveyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [surveys, setSurveys] = useState<SwitcherSurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    switcherSurveyApi
      .getAll()
      .then((data) => setSurveys(data))
      .catch((err) => {
        console.error('Failed to load switcher surveys:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const markReviewed = async (id: string) => {
    const optimistic = surveys.map((s) =>
      s.id === id ? new SwitcherSurveyResponse({ ...s, reviewed: true }) : s,
    );
    setSurveys(optimistic);
    try {
      const updated = await switcherSurveyApi.markReviewed(id);
      setSurveys((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('markReviewed failed:', err);
      setSurveys((prev) =>
        prev.map((s) => (s.id === id ? new SwitcherSurveyResponse({ ...s, reviewed: false }) : s)),
      );
      throw err;
    }
  };

  const unmarkReviewed = async (id: string) => {
    const optimistic = surveys.map((s) =>
      s.id === id ? new SwitcherSurveyResponse({ ...s, reviewed: false }) : s,
    );
    setSurveys(optimistic);
    try {
      const updated = await switcherSurveyApi.unmarkReviewed(id);
      setSurveys((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('unmarkReviewed failed:', err);
      setSurveys((prev) =>
        prev.map((s) => (s.id === id ? new SwitcherSurveyResponse({ ...s, reviewed: true }) : s)),
      );
      throw err;
    }
  };

  const toggleReviewed = (id: string) => {
    const current = surveys.find((s) => s.id === id);
    if (!current) return Promise.resolve();
    return current.reviewed ? unmarkReviewed(id) : markReviewed(id);
  };

  return (
    <SurveyContext.Provider
      value={{ surveys, loading, markReviewed, unmarkReviewed, toggleReviewed }}
    >
      {children}
    </SurveyContext.Provider>
  );
};

export const SurveyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiSurveyProvider>{children}</ApiSurveyProvider>
  ) : (
    <LocalSurveyProvider>{children}</LocalSurveyProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSurvey = (): SurveyContextType => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurvey must be used within a SurveyProvider');
  }
  return context;
};
