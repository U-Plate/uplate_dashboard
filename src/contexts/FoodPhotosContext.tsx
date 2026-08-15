import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { FoodPhoto, FoodPhotoStatus } from '../constants';
import { USE_API } from '../config';
import { foodPhotosApi } from '../api/foodPhotos';

interface FoodPhotosContextType {
  photos: FoodPhoto[];
  loading: boolean;
  /** Non-null while an approve/deny is in flight, so the card can disable itself. */
  pendingAction: string | null;
  approve: (id: string) => Promise<void>;
  deny: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const FoodPhotosContext = createContext<FoodPhotosContextType | undefined>(undefined);

/**
 * Approving a photo demotes whichever photo the food had approved before, and
 * that demotion happens server-side. Mirroring it locally keeps the list
 * honest between the optimistic update and the next refresh.
 */
const applyDecision = (
  photos: FoodPhoto[],
  id: string,
  status: FoodPhotoStatus,
): FoodPhoto[] => {
  const target = photos.find((p) => p.id === id);
  if (!target) return photos;
  const reviewedAt = Date.now();

  return photos.map((p) => {
    if (p.id === id) return new FoodPhoto({ ...p, status, reviewedAt });
    if (
      status === FoodPhotoStatus.Approved &&
      p.foodId === target.foodId &&
      p.status === FoodPhotoStatus.Approved
    ) {
      return new FoodPhoto({ ...p, status: FoodPhotoStatus.Replaced, reviewedAt });
    }
    return p;
  });
};

const LocalFoodPhotosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // There is no meaningful offline sample for this: a photo queue without real
  // images in a real bucket is an empty queue, not a fake one.
  const [photos, setPhotos] = useState<FoodPhoto[]>([]);

  const decide = async (id: string, status: FoodPhotoStatus) => {
    setPhotos((prev) => applyDecision(prev, id, status));
  };

  return (
    <FoodPhotosContext.Provider
      value={{
        photos,
        loading: false,
        pendingAction: null,
        approve: (id) => decide(id, FoodPhotoStatus.Approved),
        deny: (id) => decide(id, FoodPhotoStatus.Denied),
        refresh: async () => {},
      }}
    >
      {children}
    </FoodPhotosContext.Provider>
  );
};

const ApiFoodPhotosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<FoodPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const fetched = useRef(false);

  // Everything is fetched once and filtered client-side: the queue is small,
  // and flipping between Pending/Approved/Denied shouldn't cost a round trip.
  const load = async () => {
    const data = await foodPhotosApi.getAll('all');
    setPhotos(data);
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    load()
      .catch((err) => {
        console.error('Failed to load food photos:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const decide = async (id: string, status: FoodPhotoStatus) => {
    const snapshot = photos;
    setPendingAction(id);
    setPhotos(applyDecision(snapshot, id, status));
    try {
      const updated =
        status === FoodPhotoStatus.Approved
          ? await foodPhotosApi.approve(id)
          : await foodPhotosApi.deny(id);
      // Take the server's row for the decided photo (its url changes on
      // approval — the object moves to the food's canonical key).
      setPhotos((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      console.error(`${status} failed:`, err);
      setPhotos(snapshot);
      throw err;
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <FoodPhotosContext.Provider
      value={{
        photos,
        loading,
        pendingAction,
        approve: (id) => decide(id, FoodPhotoStatus.Approved),
        deny: (id) => decide(id, FoodPhotoStatus.Denied),
        refresh: async () => {
          setLoading(true);
          try {
            await load();
          } finally {
            setLoading(false);
          }
        },
      }}
    >
      {children}
    </FoodPhotosContext.Provider>
  );
};

export const FoodPhotosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiFoodPhotosProvider>{children}</ApiFoodPhotosProvider>
  ) : (
    <LocalFoodPhotosProvider>{children}</LocalFoodPhotosProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFoodPhotos = (): FoodPhotosContextType => {
  const context = useContext(FoodPhotosContext);
  if (!context) {
    throw new Error('useFoodPhotos must be used within a FoodPhotosProvider');
  }
  return context;
};
