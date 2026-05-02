# Tasks: Frontend Theme Redesign

## Task List

- [x] 1. Set up Recharts and testing dependencies
  - [x] 1.1 Install `recharts` as a production dependency in `frontend/package.json`
  - [x] 1.2 Install `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `fast-check` as dev dependencies
  - [x] 1.3 Add `vitest` configuration to `frontend/vite.config.js` (test environment: jsdom, globals: true, setupFiles)
  - [x] 1.4 Create `frontend/src/test/setup.js` with `@testing-library/jest-dom` import
  - [x] 1.5 Add `"test": "vitest --run"` and `"test:watch": "vitest"` scripts to `package.json`

- [x] 2. Update CSS design tokens and global styles
  - [x] 2.1 Rewrite `:root` block in `App.css` with the new dark-first token set (`--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--accent`, `--accent-warning`, `--shadow-md`, `--radius-sm`, `--radius-md`, `--radius-lg`)
  - [x] 2.2 Rewrite `body.dark` block with the dark mode token overrides (`#0f172a` background, `#1e293b` surface, emerald accent)
  - [x] 2.3 Add `body` default to dark mode (apply `dark` class by default in JS initialization)
  - [x] 2.4 Update typography: set `h2` to `1.75rem/700`, `h3` to `1.1rem/600`, `th` to `0.8rem/600 uppercase`, body to `0.95rem/400`
  - [x] 2.5 Update border-radius tokens: `--radius-sm: 6px`, `--radius-md: 12px`, `--radius-lg: 16px`
  - [x] 2.6 Add `transition: background-color 300ms ease, color 300ms ease` to `body` for smooth theme switching
  - [x] 2.7 Update `.metric`, `.chart`, `.data-table` card styles to use `var(--surface)`, `var(--border)`, `var(--radius-md)`, `var(--shadow-md)`
  - [x] 2.8 Add `.loading` spinner/skeleton styles (replace plain text loading with animated pulse)
  - [x] 2.9 Add status badge styles (`.badge` with pill shape, color variants for crop types)
  - [x] 2.10 Update responsive breakpoints for 4-col/2-col/1-col metrics grid

- [x] 3. Build the Sidebar component
  - [x] 3.1 Create `frontend/src/components/Sidebar.jsx` with collapsed/expanded state (240px / 64px)
  - [x] 3.2 Add logo/app name section at the top of the sidebar
  - [x] 3.3 Add `NavItem` sub-component that renders icon + label (label hidden when collapsed, tooltip via `title` attribute)
  - [x] 3.4 Add all 6 navigation links: Dashboard (`/`), Productivity (`/productivity`), Varieties (`/varieties`), Segments (`/segments`), Cost/Ton (`/cost-per-ton`), Cost Breakdown (`/cost-breakdown`)
  - [x] 3.5 Implement active link detection using `useLocation` — apply active styles when pathname matches the nav item's route
  - [x] 3.6 Add `GlobalSearch` component below nav links (hidden when collapsed, replaced by search icon)
  - [x] 3.7 Add QNZ selector below GlobalSearch, reading from `QnzContext`
  - [x] 3.8 Add theme toggle button at the bottom of the sidebar
  - [x] 3.9 Add collapse/expand toggle button (hamburger/arrow icon)
  - [x] 3.10 Implement mobile behavior: auto-collapse below 768px using `window.matchMedia`, add hamburger button for mobile overlay
  - [x] 3.11 Add sidebar CSS: fixed positioning, z-index, transition for width change, scrollable nav area

- [x] 4. Update App.jsx to use Sidebar layout
  - [x] 4.1 Replace `<Navbar>` import and usage with `<Sidebar>` in `App.jsx`
  - [x] 4.2 Remove the `Navbar` function from `App.jsx`
  - [x] 4.3 Pass sidebar width state to the main content area as a dynamic `marginLeft` style
  - [x] 4.4 Update `.content` CSS: remove `margin-top: 70px`, add `margin-left` driven by sidebar width, set `padding: 40px 32px`, `max-width: 1600px`
  - [x] 4.5 Move theme initialization logic (localStorage read + body class) into `Sidebar.jsx` or a `useTheme` hook

- [x] 5. Create the Segments page and add legacy redirects
  - [x] 5.1 Create `frontend/src/pages/Segments.jsx` with tab state initialized from `?tab=clubs` URL param
  - [x] 5.2 Add "Groups" and "Clubs" tab buttons at the top of the Segments page
  - [x] 5.3 Extract `GroupsTab` sub-component from `Groups.jsx` data-fetching and rendering logic
  - [x] 5.4 Extract `ClubsTab` sub-component from `Clubs.jsx` data-fetching and rendering logic
  - [x] 5.5 Replace CSS bar charts in `GroupsTab` and `ClubsTab` with Recharts `BarChart` components
  - [x] 5.6 Add `/segments` route in `App.jsx` pointing to `<Segments />`
  - [x] 5.7 Add `<Navigate to="/segments" />` for the `/groups` route in `App.jsx`
  - [x] 5.8 Add `<Navigate to="/segments?tab=clubs" />` for the `/clubs` route in `App.jsx`
  - [x] 5.9 Remove `Groups` and `Clubs` imports from `App.jsx` (they are now sub-components of Segments)

- [x] 6. Replace CSS bar charts with Recharts on all pages
  - [x] 6.1 Update `Dashboard.jsx`: replace "Top Farms by Tonnage" CSS bar chart with Recharts horizontal `BarChart` inside `ResponsiveContainer`
  - [x] 6.2 Update `Dashboard.jsx`: replace "Tonnage by Group" CSS bar chart with Recharts `BarChart`
  - [x] 6.3 Update `Dashboard.jsx`: replace "Tonnage by Crop Type" CSS bar chart with Recharts `BarChart` using crop type colors
  - [x] 6.4 Update `Productivity.jsx`: replace "Yield per Hectare by Farm" CSS bar chart with Recharts horizontal `BarChart` with color-coded cells (green above avg, amber below)
  - [x] 6.5 Update `Productivity.jsx`: replace "Yield per Hectare by Variety" CSS bar chart with Recharts `BarChart`
  - [x] 6.6 Update `CostBreakdown.jsx`: replace "Where Does the Money Go?" CSS bar chart with Recharts `BarChart`
  - [x] 6.7 Update `CostBreakdown.jsx`: replace "Cost Evolution by Quinzaine" CSS bar chart with Recharts `BarChart`, highlighting the selected QNZ bar
  - [x] 6.8 Update `CostBreakdown.jsx`: replace per-farm stacked CSS bar chart with Recharts stacked `BarChart`
  - [x] 6.9 Update `CostPerTon.jsx`: replace "Cost/Ton by Farm" CSS bar chart with Recharts horizontal `BarChart`
  - [x] 6.10 Update `CostPerTon.jsx`: replace "Cost/Ton by Variety" CSS bar chart with Recharts `BarChart`
  - [x] 6.11 Update `Varieties.jsx`: replace "Top 10 Varieties by Tonnage" CSS bar chart with Recharts `BarChart`
  - [x] 6.12 Update `Domain.jsx`: replace "Daily Harvest Pattern" vertical CSS bar chart with Recharts vertical `BarChart`
  - [x] 6.13 Update `Domain.jsx`: replace "Cost Breakdown" CSS bar chart with Recharts `BarChart`
  - [x] 6.14 Add a shared Recharts tooltip style object (using CSS variables) to a `frontend/src/utils/chartTheme.js` utility file
  - [x] 6.15 Remove unused CSS bar chart classes (`.bar-chart`, `.bar-row`, `.bar-container`, `.bar`, `.bar-chart-vertical`, etc.) from `App.css` after all pages are migrated

- [ ] 7. Write property-based and unit tests
  - [ ] 7.1 Write property test: theme toggle round trip — for any initial theme, toggling twice returns to original (fast-check, 100 iterations) — **Property 1**
  - [ ] 7.2 Write property test: theme persistence — for any theme value stored in localStorage, app initialization applies that theme to body class (fast-check, 100 iterations) — **Property 2**
  - [ ] 7.3 Write property test: sidebar width invariant — for any sequence of n collapse/expand toggles, sidebar width is always 240 or 64 (fast-check, 100 iterations) — **Property 3**
  - [ ] 7.4 Write property test: active nav link matches route — for any route from the known route set, exactly one nav item is active and its path matches (fast-check, 100 iterations) — **Property 4**
  - [ ] 7.5 Write unit test: Sidebar renders all 6 navigation links
  - [ ] 7.6 Write unit test: Sidebar applies active class to link matching current route
  - [ ] 7.7 Write unit test: Sidebar renders collapsed state (icons only, no labels) when collapsed=true
  - [ ] 7.8 Write unit test: GlobalSearch is hidden when sidebar is collapsed
  - [ ] 7.9 Write unit test: Segments renders "Groups" tab content by default
  - [ ] 7.10 Write unit test: Segments renders "Clubs" tab content when ?tab=clubs is in URL
  - [ ] 7.11 Write unit test: /groups route renders Navigate to /segments
  - [ ] 7.12 Write unit test: /clubs route renders Navigate to /segments?tab=clubs
  - [ ] 7.13 Write unit test: MetricCard with variant="best" renders value in accent color
  - [ ] 7.14 Write unit test: MetricCard with variant="warning" renders value in warning color
  - [ ] 7.15 Write unit test: loading state renders spinner/skeleton instead of plain text
  - [ ] 7.16 Run all tests and confirm they pass

- [ ] 8. Final cleanup and verification
  - [x] 8.1 Remove `Groups.jsx` and `Clubs.jsx` from `frontend/src/pages/` (logic moved into Segments sub-components)
  - [ ] 8.2 Verify all routes still work: `/`, `/productivity`, `/varieties`, `/segments`, `/cost-per-ton`, `/cost-breakdown`, `/domain/:ferme`
  - [ ] 8.3 Verify legacy redirects work: `/groups` → `/segments`, `/clubs` → `/segments?tab=clubs`
  - [ ] 8.4 Verify dark mode is the default on first load (no localStorage entry)
  - [ ] 8.5 Verify light/dark toggle persists preference to localStorage and applies on reload
  - [ ] 8.6 Verify sidebar collapse/expand works and main content margin adjusts correctly
  - [ ] 8.7 Verify mobile behavior: sidebar auto-collapses below 768px
  - [ ] 8.8 Run `npm run lint` in the `frontend` directory and fix any ESLint errors
  - [ ] 8.9 Run `npm run build` in the `frontend` directory and confirm the build succeeds with no errors
