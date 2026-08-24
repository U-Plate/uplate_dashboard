import React from 'react';
import type { ReactNode } from 'react';
import { SectionsProvider } from './SectionsContext';
import { RestaurantsProvider } from './RestaurantsContext';
import { FoodProvider } from './FoodContext';
import { MenuItemsProvider } from './MenuItemsContext';
import { FeedbackProvider } from './FeedbackContext';
import { SurveyProvider } from './SurveyContext';
import { FoodPhotosProvider } from './FoodPhotosContext';
import { ContestsProvider } from './ContestsContext';
import { InternApplicationsProvider } from './InternApplicationsContext';

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
          <ContestsProvider>
            <FeedbackProvider>
              <SurveyProvider>
                <FoodPhotosProvider>
                  <InternApplicationsProvider>{children}</InternApplicationsProvider>
                </FoodPhotosProvider>
              </SurveyProvider>
            </FeedbackProvider>
          </ContestsProvider>
          </MenuItemsProvider>
        </FoodProvider>
      </RestaurantsProvider>
    </SectionsProvider>
  );
};
