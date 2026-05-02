# Requirements Document

## Introduction

The Agri Data Lake frontend is a React + Vite dashboard that visualizes agricultural tonnage, productivity, cost, and variety data from a FastAPI backend. The current UI is functional but lacks visual polish, modern data visualization, and an efficient navigation structure. This feature redesigns the frontend with a modern dark dashboard theme, a left sidebar navigation, Recharts-based charts, and a merged Groups/Clubs page — while preserving all existing data and routing functionality.

## Glossary

- **Dashboard**: The application shell and the main overview page at the root route.
- **Sidebar**: The left-side vertical navigation panel replacing the current top navbar.
- **Segments_Page**: The merged page combining Groups and Clubs into a single route with tabs.
- **Theme**: The visual design system including color palette, typography, spacing, and component styles.
- **Dark_Mode**: The default color scheme using a deep navy/slate background with emerald green accents.
- **Light_Mode**: The alternate color scheme using a light background, toggled by the user.
- **Recharts**: The charting library used to replace all custom CSS bar charts.
- **QNZ_Selector**: The quinzaine period selector control, currently in the top navbar.
- **Metric_Card**: A summary card displaying a single KPI value with a label.
- **Data_Table**: A styled tabular component for displaying farm or variety records.
- **Accent_Color**: Emerald green (`#10b981`) used for highlights, active states, and key metrics.

---

## Requirements

### Requirement 1: Dark-First Theme with Light/Dark Toggle

**User Story:** As a user, I want the dashboard to default to a modern dark theme, so that data visualizations are easier to read and the interface feels professional.

#### Acceptance Criteria

1. THE Theme SHALL use a deep navy/slate base (`#0f172a` background, `#1e293b` surface) as the default color scheme.
2. THE Theme SHALL use emerald green (`#10b981`) as the primary accent color for highlights, active states, borders, and key metric values.
3. THE Theme SHALL define a complete set of CSS custom properties (design tokens) for background, surface, text, border, accent, warning, and shadow values.
4. WHEN the application loads for the first time, THE Dashboard SHALL render in Dark_Mode by default.
5. WHEN a stored theme preference exists in localStorage, THE Dashboard SHALL apply that preference on load instead of the default.
6. WHEN the user clicks the theme toggle, THE Theme SHALL switch between Dark_Mode and Light_Mode and persist the choice to localStorage.
7. WHILE in Light_Mode, THE Theme SHALL use a clean white/light-gray palette (`#f8fafc` background, `#ffffff` surface) with the same emerald accent.
8. THE Theme SHALL apply smooth CSS transitions (300ms) when switching between Dark_Mode and Light_Mode.

---

### Requirement 2: Left Sidebar Navigation

**User Story:** As a user, I want a left sidebar for navigation, so that I have more horizontal space for content and can navigate between pages without the navbar crowding the top.

#### Acceptance Criteria

1. THE Sidebar SHALL be rendered as a fixed left panel, 240px wide in its expanded state.
2. THE Sidebar SHALL display the application logo/name ("🌱 Agri Data Lake") at the top.
3. THE Sidebar SHALL list all navigation links: Dashboard, Productivity, Varieties, Segments, Cost/Ton, Cost Breakdown.
4. WHEN a navigation link matches the current route, THE Sidebar SHALL render that link in an active state with the Accent_Color background and full opacity text.
5. THE Sidebar SHALL display the QNZ_Selector control within the sidebar panel, below the navigation links.
6. THE Sidebar SHALL display the light/dark theme toggle at the bottom of the panel.
7. THE Sidebar SHALL support a collapsed state (64px wide, icons only) toggled by a collapse button.
8. WHEN the Sidebar is collapsed, THE Sidebar SHALL show only icon representations for each navigation item with tooltip labels on hover.
9. THE main content area SHALL have a left margin equal to the current sidebar width and adjust when the sidebar is toggled.
10. IF the viewport width is below 768px, THEN THE Sidebar SHALL collapse automatically and be accessible via a hamburger menu button.

---

### Requirement 3: Recharts-Based Data Visualization

**User Story:** As a user, I want interactive charts with tooltips, proper axes, and smooth animations, so that I can explore data more effectively than with static CSS bars.

#### Acceptance Criteria

1. THE Dashboard SHALL replace all custom CSS bar chart components with Recharts `BarChart` or `ResponsiveContainer` equivalents.
2. WHEN a user hovers over a chart bar or data point, THE Chart SHALL display a styled tooltip showing the label and formatted value.
3. THE Chart SHALL render with smooth entry animations on initial load and on data change.
4. THE Chart SHALL use the application's design tokens (accent color, text color, background) so it matches the active theme.
5. WHEN the container width changes (responsive resize), THE Chart SHALL reflow to fit the available width without overflow.
6. THE Productivity_Page SHALL use a horizontal `BarChart` for yield-per-hectare by farm, with color-coded bars (green for above-average, amber for below-average).
7. THE CostBreakdown_Page SHALL use a stacked `BarChart` for per-farm cost breakdown by category.
8. THE CostBreakdown_Page SHALL use a `BarChart` for the cost trend across quinzaines, with the selected QNZ highlighted.
9. THE Dashboard SHALL use a `BarChart` for top farms by tonnage and a separate `BarChart` for tonnage by group.
10. WHERE a page previously used a vertical CSS bar chart, THE Chart SHALL be replaced with an equivalent Recharts chart type.

---

### Requirement 4: Merged Segments Page (Groups + Clubs)

**User Story:** As a user, I want Groups and Clubs accessible from a single page, so that I don't need two separate navigation entries for closely related data.

#### Acceptance Criteria

1. THE Segments_Page SHALL be accessible at the route `/segments`.
2. THE Segments_Page SHALL render two tabs: "Groups" and "Clubs".
3. WHEN the user selects the "Groups" tab, THE Segments_Page SHALL display the group selector, the farms table for the selected group, and the tonnage bar chart for that group.
4. WHEN the user selects the "Clubs" tab, THE Segments_Page SHALL display the club selector, the farms table for the selected club, and the tonnage bar chart for that club.
5. THE Sidebar SHALL contain a single "Segments" navigation link pointing to `/segments` instead of separate "Groups" and "Clubs" links.
6. IF a user navigates to the legacy `/groups` route, THEN THE Application SHALL redirect to `/segments`.
7. IF a user navigates to the legacy `/clubs` route, THEN THE Application SHALL redirect to `/segments?tab=clubs`.
8. THE Segments_Page SHALL preserve all existing data-fetching logic from the current Groups and Clubs pages.

---

### Requirement 5: Improved Metric Cards and Layout

**User Story:** As a user, I want cleaner, more informative metric cards and a better page layout, so that key numbers are immediately visible and the pages feel structured.

#### Acceptance Criteria

1. THE Metric_Card SHALL display a label, a primary value, and an optional trend indicator or sub-label.
2. THE Metric_Card SHALL use a left accent border in the Accent_Color (or warning color for negative indicators).
3. WHEN a metric represents a "best" value, THE Metric_Card SHALL render the value in the Accent_Color.
4. WHEN a metric represents a "worst" or warning value, THE Metric_Card SHALL render the value in the warning color (`#f59e0b`).
5. THE metrics grid SHALL use a 4-column layout on wide screens, 2-column on medium screens, and 1-column on mobile.
6. THE page content area SHALL have consistent padding (32px horizontal, 40px vertical) and a maximum width of 1600px centered in the available space.
7. THE Data_Table SHALL support horizontal scrolling on small screens without breaking the page layout.
8. WHEN a table row is clickable (farm navigation), THE Data_Table SHALL show a pointer cursor and a subtle row highlight on hover.

---

### Requirement 6: Typography and Visual Consistency

**User Story:** As a user, I want consistent typography and visual polish across all pages, so that the dashboard feels like a cohesive product.

#### Acceptance Criteria

1. THE Theme SHALL use "Inter" as the body font and "Outfit" as the display/heading font, loaded via the existing setup.
2. THE Theme SHALL define a consistent type scale: page titles at 1.75rem/700, section headings at 1.1rem/600, table headers at 0.8rem/600 uppercase, body text at 0.95rem/400.
3. THE Sidebar navigation links SHALL use 0.9rem/500 weight text with icons preceding each label.
4. THE Theme SHALL define consistent border-radius tokens: 6px for small elements (buttons, badges), 12px for cards, 16px for large panels.
5. THE Theme SHALL use a single consistent card style: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `box-shadow: var(--shadow-md)`.
6. WHEN a card or interactive element is hovered, THE Theme SHALL apply a subtle elevation change (shadow increase or border color shift) with a 200ms transition.
7. THE loading state SHALL display a centered spinner or pulsing skeleton placeholder instead of plain text.
8. THE Theme SHALL define status badge styles for variety types and other categorical labels (colored pill badges).

---

### Requirement 7: Global Search Preservation

**User Story:** As a user, I want the global search to remain accessible, so that I can still quickly navigate to any farm.

#### Acceptance Criteria

1. THE Sidebar SHALL include the GlobalSearch component, positioned below the navigation links and above the QNZ_Selector.
2. THE GlobalSearch component SHALL retain its existing search-and-navigate behavior without modification to its logic.
3. WHEN the Sidebar is in collapsed state, THE GlobalSearch SHALL be hidden or replaced with a search icon that expands the sidebar.
