import { Section, Restaurant, Location, Food, MenuItem, Feedback, FeedbackType } from '../constants';

export const getSampleSections = (): Section[] => {
  return [
    new Section({ id: 'section-1', name: 'North Campus' }),
    new Section({ id: 'section-2', name: 'South Campus' }),
    new Section({ id: 'section-3', name: 'Central Campus' }),
  ];
};

export const getSampleRestaurants = (): Restaurant[] => {
  return [
    new Restaurant({
      id: 'restaurant-1',
      name: 'Campus Café',
      sectionId: 'section-1',
      location: new Location({ address: '100 North Campus Drive' }),
    }),
    new Restaurant({
      id: 'restaurant-2',
      name: 'The Dining Hall',
      sectionId: 'section-1',
      location: new Location({ address: '200 North Campus Drive' }),
    }),
    new Restaurant({
      id: 'restaurant-3',
      name: 'Pizza Place',
      sectionId: 'section-2',
      location: new Location({ address: '300 South Campus Drive' }),
    }),
    new Restaurant({
      id: 'restaurant-4',
      name: 'Healthy Bowls',
      sectionId: 'section-2',
      location: new Location({ address: '400 South Campus Drive' }),
    }),
    new Restaurant({
      id: 'restaurant-5',
      name: 'Coffee Shop',
      sectionId: 'section-3',
      location: new Location({ address: '500 Central Campus Drive' }),
    }),
  ];
};

export const getSampleFoods = (): Food[] => {
  return [
    new Food({
      id: 'food-1',
      name: 'Caesar Salad',
      restaurantId: 'restaurant-1',
      quantity: 1,
      servingSize: '300g',
      calories: 400,
      caloriesFromFat: 180,
      protein: 12,
      carbs: 25,
      fat: 20,
      saturatedFat: 6,
      sugar: 3,
      addedSugars: 1,
      sodium: 600,
      dietaryFiber: 4,
      cholesterol: 40,
      calcium: 150,
      iron: 2,
      ingredients: 'Romaine lettuce, Caesar dressing, croutons, parmesan cheese',
      labels: [],
    }),
    new Food({
      id: 'food-2',
      name: 'Grilled Chicken Breast',
      restaurantId: 'restaurant-1',
      quantity: 1,
      servingSize: '150g',
      calories: 250,
      caloriesFromFat: 50,
      protein: 45,
      carbs: 0,
      fat: 5,
      saturatedFat: 1.5,
      sugar: 0,
      addedSugars: 0,
      sodium: 300,
      dietaryFiber: 0,
      cholesterol: 90,
      calcium: 20,
      iron: 1,
      ingredients: 'Chicken breast, olive oil, herbs, spices',
      labels: [],
    }),
    new Food({
      id: 'food-3',
      name: 'Pasta Primavera',
      restaurantId: 'restaurant-2',
      quantity: 1,
      servingSize: '400g',
      calories: 550,
      caloriesFromFat: 120,
      protein: 18,
      carbs: 85,
      fat: 13,
      saturatedFat: 3,
      sugar: 8,
      addedSugars: 2,
      sodium: 450,
      dietaryFiber: 6,
      cholesterol: 15,
      calcium: 100,
      iron: 3,
      ingredients: 'Pasta, mixed vegetables, olive oil, garlic, parmesan',
      labels: [],
    }),
    new Food({
      id: 'food-4',
      name: 'Margherita Pizza',
      restaurantId: 'restaurant-3',
      quantity: 1,
      servingSize: '250g',
      calories: 650,
      caloriesFromFat: 240,
      protein: 28,
      carbs: 75,
      fat: 27,
      saturatedFat: 12,
      sugar: 6,
      addedSugars: 3,
      sodium: 1200,
      dietaryFiber: 4,
      cholesterol: 50,
      calcium: 350,
      iron: 4,
      ingredients: 'Pizza dough, mozzarella, tomato sauce, basil, olive oil',
      labels: [],
    }),
    new Food({
      id: 'food-5',
      name: 'Pepperoni Pizza',
      restaurantId: 'restaurant-3',
      quantity: 1,
      servingSize: '280g',
      calories: 750,
      caloriesFromFat: 320,
      protein: 32,
      carbs: 78,
      fat: 36,
      saturatedFat: 16,
      sugar: 7,
      addedSugars: 4,
      sodium: 1600,
      dietaryFiber: 3,
      cholesterol: 65,
      calcium: 380,
      iron: 5,
      ingredients: 'Pizza dough, mozzarella, tomato sauce, pepperoni',
      labels: [],
    }),
    new Food({
      id: 'food-6',
      name: 'Quinoa Power Bowl',
      restaurantId: 'restaurant-4',
      quantity: 1,
      servingSize: '350g',
      calories: 450,
      caloriesFromFat: 150,
      protein: 22,
      carbs: 55,
      fat: 17,
      saturatedFat: 2.5,
      sugar: 8,
      addedSugars: 0,
      sodium: 350,
      dietaryFiber: 10,
      cholesterol: 0,
      calcium: 80,
      iron: 4,
      ingredients: 'Quinoa, kale, chickpeas, avocado, tahini dressing',
      labels: [],
    }),
    new Food({
      id: 'food-7',
      name: 'Acai Bowl',
      restaurantId: 'restaurant-4',
      quantity: 1,
      servingSize: '300g',
      calories: 380,
      caloriesFromFat: 90,
      protein: 8,
      carbs: 68,
      fat: 10,
      saturatedFat: 1.5,
      sugar: 42,
      addedSugars: 8,
      sodium: 50,
      dietaryFiber: 12,
      cholesterol: 0,
      calcium: 120,
      iron: 2,
      ingredients: 'Acai puree, banana, granola, berries, honey, coconut',
      labels: [],
    }),
    new Food({
      id: 'food-8',
      name: 'Cappuccino',
      restaurantId: 'restaurant-5',
      quantity: 1,
      servingSize: '240ml',
      calories: 120,
      caloriesFromFat: 40,
      protein: 6,
      carbs: 12,
      fat: 4.5,
      saturatedFat: 2.8,
      sugar: 10,
      addedSugars: 0,
      sodium: 95,
      dietaryFiber: 0,
      cholesterol: 15,
      calcium: 180,
      iron: 0,
      ingredients: 'Espresso, steamed milk, milk foam',
      labels: [],
    }),
    new Food({
      id: 'food-9',
      name: 'Blueberry Muffin',
      restaurantId: 'restaurant-5',
      quantity: 1,
      servingSize: '120g',
      calories: 380,
      caloriesFromFat: 140,
      protein: 6,
      carbs: 55,
      fat: 16,
      saturatedFat: 3,
      sugar: 28,
      addedSugars: 22,
      sodium: 420,
      dietaryFiber: 2,
      cholesterol: 45,
      calcium: 60,
      iron: 2,
      ingredients: 'Flour, sugar, blueberries, eggs, butter, milk, baking powder',
      labels: [],
    }),
    new Food({
      id: 'food-10',
      name: 'Garden Salad',
      restaurantId: 'restaurant-2',
      quantity: 1,
      servingSize: '200g',
      calories: 120,
      caloriesFromFat: 45,
      protein: 4,
      carbs: 15,
      fat: 5,
      saturatedFat: 0.8,
      sugar: 6,
      addedSugars: 0,
      sodium: 180,
      dietaryFiber: 5,
      cholesterol: 0,
      calcium: 60,
      iron: 2,
      ingredients: 'Mixed greens, tomatoes, cucumbers, carrots, vinaigrette',
      labels: [],
    }),
  ];
};

export const getSampleMenuItems = (): MenuItem[] => {
  const sampleFoods = getSampleFoods();
  return [
    new MenuItem({
      id: 'menu-item-1',
      name: 'Healthy Lunch Combo',
      restaurantId: 'restaurant-1',
      foods: [
        { food: sampleFoods.find((f) => f.id === 'food-1')!, quantity: 1 },
        { food: sampleFoods.find((f) => f.id === 'food-2')!, quantity: 1 },
      ],
      possibleFoods: [],
      sizes: [],
    }),
    new MenuItem({
      id: 'menu-item-2',
      name: 'Pasta Meal Deal',
      restaurantId: 'restaurant-2',
      foods: [
        { food: sampleFoods.find((f) => f.id === 'food-3')!, quantity: 1 },
      ],
      possibleFoods: [
        { food: sampleFoods.find((f) => f.id === 'food-10')!, quantity: 1 },
      ],
      sizes: [],
    }),
    new MenuItem({
      id: 'menu-item-3',
      name: 'Pizza Feast',
      restaurantId: 'restaurant-3',
      foods: [],
      possibleFoods: [],
      sizes: [
        {
          name: 'Regular',
          foods: [
            { food: sampleFoods.find((f) => f.id === 'food-4')!, quantity: 2 },
          ],
          possibleFoods: [
            { food: sampleFoods.find((f) => f.id === 'food-5')!, quantity: 1 },
          ],
        },
        {
          name: 'Family',
          foods: [
            { food: sampleFoods.find((f) => f.id === 'food-4')!, quantity: 4 },
            { food: sampleFoods.find((f) => f.id === 'food-5')!, quantity: 2 },
          ],
          possibleFoods: [],
        },
      ],
    }),
    new MenuItem({
      id: 'menu-item-4',
      name: 'Coffee & Pastry',
      restaurantId: 'restaurant-5',
      foods: [
        { food: sampleFoods.find((f) => f.id === 'food-8')!, quantity: 1 },
      ],
      possibleFoods: [
        { food: sampleFoods.find((f) => f.id === 'food-9')!, quantity: 1 },
      ],
      sizes: [],
    }),
  ];
};

export const getSampleFeedback = (): Feedback[] => {
  const daysAgo = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };

  return [
    new Feedback({
      id: 'feedback-1',
      schoolId: 'purdue',
      type: FeedbackType.Bug,
      message:
        'The calorie count on the Chicken Caesar wrap at Campus Cafe is showing 0 instead of the actual value. Tried both on web and mobile.',
      timestampString: daysAgo(1),
      email: 'jordan.lee@purdue.edu',
      handled: false,
    }),
    new Feedback({
      id: 'feedback-2',
      schoolId: 'purdue',
      type: FeedbackType.Suggestion,
      message:
        'Would love a way to filter foods by allergen, especially nuts and dairy. Right now I have to open every item to check.',
      timestampString: daysAgo(2),
      email: 'priya.shah@purdue.edu',
      handled: false,
    }),
    new Feedback({
      id: 'feedback-3',
      schoolId: 'purdue',
      type: FeedbackType.Question,
      message: 'Are the macros listed for a single serving or the whole container?',
      timestampString: daysAgo(3),
      email: 'mhassan@purdue.edu',
      handled: false,
    }),
    new Feedback({
      id: 'feedback-4',
      schoolId: 'purdue',
      type: FeedbackType.Compliment,
      message:
        'Just wanted to say the new menu item view is so much faster than before. Thanks for the work, it makes meal planning actually doable.',
      timestampString: daysAgo(4),
      email: 'rivera.a@purdue.edu',
      handled: true,
    }),
    new Feedback({
      id: 'feedback-5',
      schoolId: 'purdue',
      type: FeedbackType.Bug,
      message:
        'App crashes when I try to add the Pizza Place build-your-own pizza to my plate with more than four toppings selected.',
      timestampString: daysAgo(5),
      email: 'tnguyen@purdue.edu',
      handled: false,
    }),
    new Feedback({
      id: 'feedback-6',
      schoolId: 'purdue',
      type: FeedbackType.Other,
      message:
        'Healthy Bowls should be listed under South Campus, not Central. It moved last semester.',
      timestampString: daysAgo(7),
      email: 'kchen@purdue.edu',
      handled: true,
    }),
    new Feedback({
      id: 'feedback-7',
      schoolId: 'purdue',
      type: FeedbackType.Suggestion,
      message: 'Dark mode would be huge for late-night study breaks.',
      timestampString: daysAgo(9),
      email: 'student-anon@purdue.edu',
      handled: false,
    }),
    new Feedback({
      id: 'feedback-8',
      schoolId: 'purdue',
      type: FeedbackType.Bug,
      message: 'Sodium values for the Coffee Shop pastries seem doubled. The cinnamon roll lists 1480mg.',
      timestampString: daysAgo(12),
      email: 'lwilliams@purdue.edu',
      handled: false,
    }),
    new Feedback({
      id: 'feedback-9',
      schoolId: 'purdue',
      type: FeedbackType.Question,
      message: 'Do the totals account for the dressing if I pick a salad?',
      timestampString: daysAgo(14),
      email: 'omar.kim@purdue.edu',
      handled: true,
    }),
    new Feedback({
      id: 'feedback-10',
      schoolId: 'purdue',
      type: FeedbackType.Compliment,
      message: 'Love the new filter chips. Genuinely useful.',
      timestampString: daysAgo(16),
      email: 'sjohnson@purdue.edu',
      handled: false,
    }),
    new Feedback({
      id: 'feedback-11',
      schoolId: 'purdue',
      type: FeedbackType.Suggestion,
      message:
        'It would be great if menu items showed up in search even when a restaurant is closed for the day.',
      timestampString: daysAgo(20),
      email: 'evan.park@purdue.edu',
      handled: false,
    }),
    new Feedback({
      id: 'feedback-12',
      schoolId: 'purdue',
      type: FeedbackType.Other,
      message: 'How do I delete my account?',
      timestampString: daysAgo(28),
      email: 'jaylenfoster@purdue.edu',
      handled: true,
    }),
  ];
};

/**
 * Initialize all sample data into localStorage
 * Only call this if localStorage is empty
 */
export const initializeSampleData = (): void => {
  if (!localStorage.getItem('uplate_sections')) {
    localStorage.setItem('uplate_sections', JSON.stringify(getSampleSections()));
  }
  if (!localStorage.getItem('uplate_restaurants')) {
    localStorage.setItem('uplate_restaurants', JSON.stringify(getSampleRestaurants()));
  }
  if (!localStorage.getItem('uplate_foods')) {
    localStorage.setItem('uplate_foods', JSON.stringify(getSampleFoods()));
  }
  if (!localStorage.getItem('uplate_menu_items')) {
    localStorage.setItem('uplate_menu_items', JSON.stringify(getSampleMenuItems()));
  }
  if (!localStorage.getItem('uplate_feedback')) {
    localStorage.setItem('uplate_feedback', JSON.stringify(getSampleFeedback()));
  }
};
