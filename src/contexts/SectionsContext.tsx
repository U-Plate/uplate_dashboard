import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Section } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { getSampleSections } from '../utils/sampleData';
import { USE_API } from '../config';
import { sectionsApi } from '../api/sections';

interface SectionsContextType {
  sections: Section[];
  addSection: (section: Omit<Section, 'id'>) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  getSectionById: (id: string) => Section | undefined;
}

const SectionsContext = createContext<SectionsContextType | undefined>(undefined);

const LocalSectionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sections, setSections] = useLocalStorage<Section[]>(
    'uplate_sections',
    getSampleSections()
  );

  const addSection = (sectionData: Omit<Section, 'id'>) => {
    const newSection = new Section({ id: generateId(), ...sectionData });
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(
      sections.map((s) => (s.id === id ? new Section({ ...s, ...updates }) : s))
    );
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const getSectionById = (id: string) => sections.find((s) => s.id === id);

  return (
    <SectionsContext.Provider
      value={{ sections, addSection, updateSection, deleteSection, getSectionById }}
    >
      {children}
    </SectionsContext.Provider>
  );
};

const ApiSectionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sections, setSections] = useState<Section[]>([]);

  const fetchSections = useCallback(async () => {
    const data = await sectionsApi.getAll();
    setSections(data);
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const addSection = async (sectionData: Omit<Section, 'id'>) => {
    const created = await sectionsApi.create(sectionData);
    setSections((prev) => [...prev, created]);
  };

  const updateSection = async (id: string, updates: Partial<Section>) => {
    const updated = await sectionsApi.update(id, updates);
    setSections((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const deleteSection = async (id: string) => {
    await sectionsApi.delete(id);
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const getSectionById = (id: string) => sections.find((s) => s.id === id);

  return (
    <SectionsContext.Provider
      value={{ sections, addSection, updateSection, deleteSection, getSectionById }}
    >
      {children}
    </SectionsContext.Provider>
  );
};

export const SectionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiSectionsProvider>{children}</ApiSectionsProvider>
  ) : (
    <LocalSectionsProvider>{children}</LocalSectionsProvider>
  );
};

export const useSections = (): SectionsContextType => {
  const context = useContext(SectionsContext);
  if (!context) {
    throw new Error('useSections must be used within a SectionsProvider');
  }
  return context;
};
