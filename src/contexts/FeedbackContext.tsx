import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Feedback } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getSampleFeedback } from '../utils/sampleData';
import { USE_API } from '../config';
import { feedbacksApi } from '../api/feedbacks';

interface FeedbackContextType {
  feedback: Feedback[];
  loading: boolean;
  markHandled: (id: string) => void | Promise<void>;
  unmarkHandled: (id: string) => void | Promise<void>;
  toggleHandled: (id: string) => void | Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const reviveFeedback = (data: unknown): Feedback[] => {
  if (!Array.isArray(data)) return [];
  return data.map((f) => new Feedback(f as Feedback));
};

const LocalFeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [feedback, setFeedback] = useLocalStorage<Feedback[]>(
    'uplate_feedback',
    getSampleFeedback(),
    reviveFeedback,
  );

  const setHandledFor = (id: string, handled: boolean) => {
    setFeedback(
      feedback.map((f) =>
        f.id === id ? new Feedback({ ...f, handled }) : f,
      ),
    );
  };

  const markHandled = (id: string) => setHandledFor(id, true);
  const unmarkHandled = (id: string) => setHandledFor(id, false);
  const toggleHandled = (id: string) => {
    const current = feedback.find((f) => f.id === id);
    if (!current) return;
    setHandledFor(id, !current.handled);
  };

  return (
    <FeedbackContext.Provider
      value={{ feedback, loading: false, markHandled, unmarkHandled, toggleHandled }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

const ApiFeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    feedbacksApi
      .getAll()
      .then((data) => setFeedback(data))
      .catch((err) => {
        console.error('Failed to load feedback:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const markHandled = async (id: string) => {
    const optimistic = feedback.map((f) =>
      f.id === id ? new Feedback({ ...f, handled: true }) : f,
    );
    setFeedback(optimistic);
    try {
      const updated = await feedbacksApi.markHandled(id);
      setFeedback((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch (err) {
      console.error('markHandled failed:', err);
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? new Feedback({ ...f, handled: false }) : f)),
      );
      throw err;
    }
  };

  const unmarkHandled = async (id: string) => {
    const optimistic = feedback.map((f) =>
      f.id === id ? new Feedback({ ...f, handled: false }) : f,
    );
    setFeedback(optimistic);
    try {
      const updated = await feedbacksApi.unmarkHandled(id);
      setFeedback((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch (err) {
      console.error('unmarkHandled failed:', err);
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? new Feedback({ ...f, handled: true }) : f)),
      );
      throw err;
    }
  };

  const toggleHandled = (id: string) => {
    const current = feedback.find((f) => f.id === id);
    if (!current) return Promise.resolve();
    return current.handled ? unmarkHandled(id) : markHandled(id);
  };

  return (
    <FeedbackContext.Provider
      value={{ feedback, loading, markHandled, unmarkHandled, toggleHandled }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiFeedbackProvider>{children}</ApiFeedbackProvider>
  ) : (
    <LocalFeedbackProvider>{children}</LocalFeedbackProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
