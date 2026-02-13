import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import './App.css';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SectionsPage } from './pages/SectionsPage';
import { SectionForm } from './pages/SectionForm';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { RestaurantForm } from './pages/RestaurantForm';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { FoodForm } from './pages/FoodForm';
import { MenuItemForm } from './pages/MenuItemForm';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sections" element={<SectionsPage />} />
            <Route path="sections/new" element={<SectionForm />} />
            <Route path="sections/:id/edit" element={<SectionForm />} />
            <Route path="restaurants" element={<RestaurantsPage />} />
            <Route path="restaurants/new" element={<RestaurantForm />} />
            <Route path="restaurants/:id/edit" element={<RestaurantForm />} />
            <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
            <Route path="restaurants/:id/foods/new" element={<FoodForm />} />
            <Route path="restaurants/:id/foods/:foodId/edit" element={<FoodForm />} />
            <Route path="restaurants/:id/menu-items/new" element={<MenuItemForm />} />
            <Route path="restaurants/:id/menu-items/:menuItemId/edit" element={<MenuItemForm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

export default App;
