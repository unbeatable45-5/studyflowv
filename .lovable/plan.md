

## Student Hub App — Implementation Plan

### Overview
A mobile-first PWA student productivity app with three AI-powered tools, a dashboard, and a tutorial section. Uses a clean blue & white academic design with Lovable AI (Gemini) powering the backend.

---

### 1. PWA Setup
- Install `vite-plugin-pwa`, configure manifest with app name "Student Hub", blue theme color, and PWA icons
- Add mobile-optimized meta tags to `index.html`
- Create `/install` page with install prompt for mobile users
- Exclude `/~oauth` from service worker cache

### 2. Design System & Layout
- Blue & white academic color scheme (primary blue ~220°, clean whites, soft gray backgrounds)
- Mobile-first responsive layout with bottom navigation bar (Dashboard, Study, Notes, Planner)
- Top app bar with "Student Hub" branding
- Cards-based UI throughout, large touch targets, clear typography

### 3. Dashboard (Home Page)
- Welcome greeting
- Three tool cards: Quick Study Helper, Mini Note Organizer, Revision Planner
- Each card shows tool name, icon, brief description, and "Start" button
- "Recent Activity" section showing last outputs from each tool
- Tutorial access link/button

### 4. Quick Study Helper
- **Input form**: Single text field for topic name + "Generate" button
- **AI backend**: Edge function calls Lovable AI with a hidden prompt that returns a concise explanation + 3 practice questions with answers
- **Output**: Rendered explanation section, numbered Q&A cards with expandable answers
- **Actions**: Copy to clipboard, share (Web Share API)
- Saves last result to localStorage for dashboard display

### 5. Mini Note Organizer
- **Input form**: Large textarea for pasting notes + "Organize" button
- **AI backend**: Edge function with prompt to extract bullet-point summary, key terms, and auto-detect headings for multiple topics
- **Output**: Organized summary with headings, bullet points, highlighted key terms
- **Actions**: Copy, share
- Saves last result to localStorage

### 6. AI Revision Planner
- **Input form**: 
  - Dynamic course list (add/remove courses)
  - Optional exam date picker per course (with "I don't know yet" checkbox)
  - Preferred study hours/day slider or input
  - "Generate Plan" button
- **AI backend**: Edge function generates daily/weekly study schedule table with placeholders for unknown dates and reminder suggestions
- **Output**: Table/calendar view of study plan, reminder notes
- **Actions**: Copy, share

### 7. Tutorial Section
- **Input form**: University/Host, Department, Subject/Course, Location (all optional)
- **Output**: Step-by-step guide personalized to their context with example outputs
- "Try it now" buttons linking to each tool
- Works without AI — template-based with optional AI enhancement

### 8. Backend (Lovable Cloud)
- Enable Lovable Cloud
- Three edge functions: `study-helper`, `note-organizer`, `revision-planner`
- Each handles AI prompting invisibly, returns structured content
- Proper error handling for rate limits (429) and payment (402)
- Streaming responses for better UX

### 9. Shared Features
- All outputs are copyable (copy button) and shareable (Web Share API with fallback)
- Loading states with skeleton UI during AI generation
- localStorage caching of recent outputs
- Responsive on all screen sizes, optimized for mobile

