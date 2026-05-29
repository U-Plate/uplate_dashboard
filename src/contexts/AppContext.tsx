import React from 'react';
import type { ReactNode } from 'react';
import { SectionsProvider } from './SectionsContext';
import { RestaurantsProvider } from './RestaurantsContext';
import { FoodProvider } from './FoodContext';
import { MenuItemsProvider } from './MenuItemsContext';
import { FeedbackProvider } from './FeedbackContext';

/**
 * AppProvider combines all context providers
 * This ensures proper initialization order and simplifies App.tsx
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SectionsProvider>
      <RestaurantsProvider>
        <FoodProvider>
          <MenuItemsProvider>
            <FeedbackProvider>{children}</FeedbackProvider>
          </MenuItemsProvider>
        </FoodProvider>
      </RestaurantsProvider>
    </SectionsProvider>
  );
};
