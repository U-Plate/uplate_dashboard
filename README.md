# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## School food overrides

Open **School Food Overrides** from the dashboard or **Food Overrides** in the
navigation. Set the admin key on the dashboard first. API base URL and school
are configured in `src/config.ts`.

Search the school catalog by the beginning of a food name (up to 20 results),
or look up an exact food ID. Edit the desired fields and select **Save override**.
Opening a search result fetches its details again with `bypassCache=true`;
food lookups also use `cache: 'no-store'` to bypass the browser cache.
Only changed values are sent. Nutrients accept nonnegative numbers or `-1` for
unknown. Labels use a JSON array of strings, such as `["Vegan"]`.

For serving size corrections, use the **Nutrient multiplier** beside Serving
Size: enter `2` to double or `0.5` to halve the current nutrients, then select
**Apply multiplier**. Unknown (`-1`) and empty nutrients stay unchanged. Edit
the serving size text separately, review the scaled values, and save. Applying
a multiplier only updates the draft; **Discard changes** restores saved values.

Before each save, the dashboard runs the authenticated, idempotent
`GET /:school/ensureSchema` migration. It then posts a flat patch to
`/:school/foods/overrideFood` (`totalFat` on writes, `fat` on reads) and reloads
with `bypassCache=true` to verify. These corrections affect the shared school
food across every menu referencing its ID and remain protected from scrapes.
Existing overrides can be edited again; the API has no reset endpoint.
Restaurant-created foods continue to use their existing editing flow.

Run dashboard regression tests with `npm test`. These mock API calls; they do
not modify a database. Backend regression tests described in the API contract
belong to the backend repository.
