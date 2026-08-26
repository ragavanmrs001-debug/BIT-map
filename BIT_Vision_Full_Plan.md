# BIT Vision — Full Four-Year Project Plan

## 1. Project Goal

Build **BIT Vision**, a student-focused geospatial web application centered on **Bannari Amman Institute of Technology (BIT), Alathukombai, Sathyamangalam, Erode District, Tamil Nadu**.

The application should combine:

- High-quality 2D campus mapping
- High-quality 3D Earth/campus visualization
- Real device location tracking
- Automatic movement tracking
- 2D + 3D synchronized positioning
- Satellite imagery from legitimate data providers
- Near-real-time environmental data
- Campus buildings and facilities
- Campus navigation
- Student/hostel-oriented information
- A polished, modern geospatial interface

The system should be useful during all four years of college and should also be architected so the geographic engine works outside BIT when the user travels elsewhere.

---

# 2. Core Product Idea

## BIT Vision

Primary experience:

1. Open the app.
2. It detects the user's location after permission is granted.
3. The interface starts at the user's current geographic position.
4. When the user is around BIT, the app emphasizes campus-specific information.
5. When the user moves, the location marker and camera update automatically.
6. The same location data drives both 2D and 3D views.
7. The user can turn "Follow Me" on or off.
8. The user can explore freely without the camera constantly snapping back.
9. Satellite imagery is shown with its real source and acquisition/update time.
10. Near-real-time data is clearly distinguished from true GPS/live sensor data.

---

# 3. Critical Reality Constraints

## Satellite imagery

Do NOT present delayed satellite imagery as continuous live video.

Use legitimate imagery sources and show:

- Provider
- Dataset/layer
- Acquisition date/time when available
- Last update/availability time
- "Near Real-Time" when appropriate

Suitable sources to investigate:

- NASA Worldview / GIBS
- Google Earth Engine
- Other official/open geospatial datasets

Google Earth Engine provides APIs for geospatial imagery, assets, maps, tables and analysis.

## GPS

Use the browser/device Geolocation API.

The app can provide:

- Current latitude
- Current longitude
- Accuracy
- Speed when available
- Heading when available
- Distance travelled
- Timestamp of latest location update

Do not fabricate coordinates.

---

# 4. Recommended Architecture

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Three Fiber / Three.js for 3D
- MapLibre GL JS for 2D
- Reusable component system

## Backend

Use a backend only where it is actually useful.

Preferred:

- FastAPI
- Python
- PostgreSQL
- PostGIS where spatial queries become necessary

## Data services

Create provider abstractions instead of hard-coding one provider into every component.

Example:

```text
SatelliteProvider
WeatherProvider
EarthquakeProvider
FireProvider
CampusDataProvider
LocationProvider
RoutingProvider
```

---

# 5. High-Level System Architecture

```text
                         BIT VISION
                              |
                 +------------+------------+
                 |                         |
             FRONTEND                   BACKEND
                 |                         |
       +---------+---------+       +-------+-------+
       |                   |       |               |
      2D                  3D    API Services   Spatial DB
     Map                 Globe       |             |
       |                   |         |             |
       +---------+---------+---------+-------------+
                 |
          LOCATION MANAGER
                 |
          Browser / Device GPS
                 |
      +----------+----------+
      |          |          |
      2D        3D       Navigation
      |          |          |
      +----------+----------+
                 |
          External Data APIs
                 |
       Satellite / Weather /
       Campus / Event Data
```

---

# 6. Location System

## Single source of truth

Create one `LocationManager`.

It owns:

- Permission state
- Current coordinates
- Accuracy
- Previous coordinates
- Speed
- Heading
- Update timestamp
- Distance travelled
- Tracking state
- Follow Me state

2D and 3D must subscribe to the same location state.

Do NOT create separate GPS implementations.

## Location update flow

```text
GPS update
   |
LocationManager
   |
Filter / smooth noisy readings
   |
Update application state
   |
+-------------------+
|                   |
2D map             3D globe
|                   |
camera/marker       camera/marker
```

---

# 7. Follow Me System

Create two controls.

## Follow Me

When ON:

- Keep the user visible
- Smoothly move the 2D camera
- Smoothly move the 3D camera
- Optionally orient according to heading
- Continue following movement

When OFF:

- User can explore independently
- Manual map/globe movement must not be immediately overridden

## Recenter on Me

One-time action:

- Animate the camera to the current position
- Does not force continuous tracking

This separation is important for a usable navigation experience.

---

# 8. Global Location Capability

Although the project is centered on BIT, the location engine must not be hard-coded to BIT.

Example:

```text
BIT
 -> Chennai
 -> Bengaluru
 -> Mumbai
 -> USA
```

The system should automatically follow the user wherever the device reports a valid location.

The BIT-specific overlay can disappear or reduce outside the campus region while the global base map continues working.

---

# 9. 2D Map

## Features

- Satellite/map toggle
- User location
- Follow Me
- Recenter
- Zoom
- Rotation
- Search
- Selected location
- Campus markers
- Walking route
- Layer controls
- Current coordinates
- Scale indicator
- Attribution
- Loading state
- Error state

## Campus detail

When near BIT, expose:

- Academic blocks
- Departments
- Hostels
- Main gate
- Roads
- Walking paths
- Cafeteria/mess
- Medical centre
- Gym
- Sports areas
- Parking
- Other verified campus facilities

Do not invent campus coordinates.

---

# 10. 3D Earth / 3D Campus

## Goal

Create a cinematic but technically sensible 3D experience.

Features:

- High-quality Earth sphere
- Day/night lighting
- Atmosphere
- Cloud layer where data/assets support it
- Stars/background
- Smooth zoom
- Smooth Earth-to-campus transition
- User location marker
- Campus-level camera
- Optional terrain
- Camera follow
- Heading-based camera option
- Performance fallback for lower-end devices

## Geographic transition

Example:

```text
Earth
  ↓
India
  ↓
Tamil Nadu
  ↓
Erode
  ↓
Sathyamangalam
  ↓
BIT
  ↓
Current user location
```

Camera movement should be smooth, not an abrupt jump.

---

# 11. Satellite Imagery

## Satellite layer architecture

Create a reusable layer service.

Possible layers:

- True color
- False color
- Clouds
- Thermal where legitimately available
- Fires/hotspots where legitimately available
- Vegetation where legitimately available
- Other official Earth observation layers

Every layer should expose metadata:

```text
SOURCE
DATASET
IMAGE DATE
LAST AVAILABLE UPDATE
STATUS
```

Do not show "LIVE" unless the underlying data actually supports that statement.

Use real imagery rather than locally generated fake satellite screenshots.

---

# 12. Satellite Timeline

Add a temporal playback interface.

Features:

- Available imagery dates/times
- Previous image
- Next image
- Play
- Pause
- Latest available
- Availability gaps
- Selected timestamp
- Source metadata

Do not generate fake timestamps.

If a dataset updates every several hours/days, the timeline should reflect that actual availability.

---

# 13. Weather

Create a BIT-area weather panel.

Show:

- Temperature
- Feels-like temperature
- Humidity
- Wind
- Rain
- Pressure where available
- Weather condition
- Last update
- Forecast if a reliable provider is connected

Outside BIT, weather should follow the user's current location.

---

# 14. Disaster / Environmental Layers

Architect optional layers for:

- Fires
- Earthquakes
- Severe weather
- Flood indicators
- Air quality where available
- Other verified environmental observations

Do not add a layer just for visual effect. Every layer needs an actual data source.

---

# 15. Campus Explorer

Users should be able to search:

- Building names
- Departments
- Labs
- Hostels
- Facilities
- Gates
- Other verified points of interest

Clicking a location should open an information card.

Example structure:

```text
Name
Category
Description
Coordinates
Distance from current user
Navigate
```

---

# 16. Walking Navigation

Allow:

```text
START
DESTINATION
```

Then calculate:

- Walking route
- Distance
- Estimated walking time
- Turn instructions where supported

When the user moves:

- Update current position
- Update route progress
- Recalculate only when useful
- Avoid excessive API requests

---

# 17. Hostel / Student Features

Optional modules for later stages:

- Hostel locations
- Mess
- Laundry
- Medical centre
- Gym
- Transport
- Important student facilities
- Personal notes
- Saved locations
- Class locations
- Event locations

Do not assume private/internal information unless the user supplies or an official source provides it.

---

# 18. "My BIT" Long-Term Module

Make the application useful throughout four years.

Possible sections:

```text
My BIT
  |
  +-- First Year
  +-- Second Year
  +-- Third Year
  +-- Fourth Year
  +-- Saved Places
  +-- Classes
  +-- Events
  +-- Notes
```

This should be modular so it can be added without rewriting the mapping engine.

---

# 19. AI "Ask Earth" / "Ask BIT"

Later-stage feature.

Examples:

- "Where is my next class?"
- "Navigate from hostel to CSE block."
- "Show weather around BIT."
- "Show available satellite imagery."
- "Show fire data around this region."
- "Where am I now?"

The AI should call structured application tools rather than directly manipulating random UI state.

Example:

```text
User request
   |
AI interpretation
   |
Structured tool/action
   |
Location / Map / Data service
   |
UI update
```

---

# 20. UI Design Direction

Use a modern geospatial interface:

- Dark mode
- High contrast
- Thin technical HUD elements
- Soft glass panels where useful
- Large map/globe area
- Minimal clutter
- Smooth transitions
- Clear typography
- Strong hierarchy
- Accessible controls
- Mobile-first layout

Do not copy the reference site's source code.

Use the reference website only as a design/experience reference.

---

# 21. Suggested Main Interface

```text
+----------------------------------------------------------+
| BIT VISION                         Location ●   LIVE DATA |
+----------------+-----------------------------------------+
|                |                                         |
| LAYERS         |                                         |
|                |             MAP / 3D GLOBE               |
| Satellite      |                                         |
| Buildings      |               YOU                       |
| Hostels        |                ●                        |
| Weather        |                                         |
| Fires          |                                         |
| Earthquakes    |                                         |
|                |                                         |
+----------------+-----------------------------------------+
| Current Location | Weather | Accuracy | Speed | Follow Me |
+----------------------------------------------------------+
```

---

# 22. Performance

The application must be designed for real devices, not only powerful desktops.

Use:

- Lazy loading
- Code splitting
- Texture optimization
- Level of detail where useful
- Map tile management
- Debounced network requests
- GPS smoothing
- Cached data
- Graceful degradation
- Device-aware 3D quality

Provide a lower-quality rendering fallback for weak hardware.

---

# 23. Security and API Keys

Never hard-code secret API keys into client-side source code.

Use:

```text
.env.local
.env.example
```

Keep server-only secrets on the server.

Document required keys and exactly where each one is used.

---

# 24. Data Integrity Rules

The application must never:

- Fabricate coordinates
- Fabricate satellite timestamps
- Claim delayed imagery is live
- Pretend an unavailable API succeeded
- Hide data-source failures
- Hard-code fake "real-time" values

When data is unavailable, show a truthful state such as:

```text
Data unavailable
Last successful update: ...
```

---

# 25. Development Phases

## Phase 0 — Discovery

- Inspect reference website
- Inspect official BIT information
- Decide data sources
- Define campus data model
- Define UI architecture
- Define location architecture

## Phase 1 — Foundation

- Create project
- Configure TypeScript
- Configure styling
- Create layout system
- Create reusable UI components
- Create environment configuration

## Phase 2 — 2D Map

- Map integration
- User marker
- Search
- Controls
- Follow Me
- Recenter
- Layers

## Phase 3 — Location Manager

- Permission flow
- Position tracking
- Accuracy
- Speed
- Heading
- Distance
- Smoothing
- Shared state

## Phase 4 — 3D Globe

- Earth
- Lighting
- Atmosphere
- Camera
- Smooth geographic transitions
- User location
- Follow Me

## Phase 5 — Campus Dataset

- Verified campus POIs
- Buildings
- Hostels
- Facilities
- Search
- Information cards

## Phase 6 — Satellite

- Provider abstraction
- Actual imagery
- Metadata
- Layer controls
- Timeline

## Phase 7 — Weather / Environmental Data

- Weather
- Fires
- Earthquakes
- Other verified layers

## Phase 8 — Navigation

- Routing
- Walking distance
- ETA
- Dynamic route progress

## Phase 9 — Student Features

- My BIT
- Saved locations
- Hostel helpers
- Classes/events when data is available

## Phase 10 — AI

- Ask BIT
- Ask Earth
- Structured tool calls
- Safe fallbacks

## Phase 11 — QA

- Desktop
- Mobile
- Location denied
- Location inaccurate
- Offline/slow network
- API failures
- Large zoom changes
- 2D/3D synchronization
- Browser console
- Performance
- Accessibility

## Phase 12 — Deployment

- Production build
- Environment variables
- Backend deployment if required
- Domain
- Error monitoring
- Documentation

---

# 26. Definition of Done

The project is not finished when code exists.

A feature is finished only when:

1. It is implemented.
2. The application builds successfully.
3. The application runs.
4. The browser UI has been tested.
5. Console/runtime errors are addressed.
6. Loading/error/empty states exist.
7. The feature uses real data where required.
8. It does not contain fake data presented as real.
9. Mobile behavior is checked.
10. Documentation is updated.

---

# 27. Final Product Target

The finished BIT Vision application should feel like:

**A professional campus digital-twin / geospatial navigation product**

rather than:

- a simple college website
- a static map
- a fake satellite dashboard
- a generic AI-generated demo

Core identity:

```text
REAL LOCATION
+
REAL MAP DATA
+
REAL SATELLITE DATA
+
REAL WEATHER DATA
+
2D MAP
+
3D GLOBE
+
CAMPUS INFORMATION
+
NAVIGATION
=
BIT VISION
```

---

# 28. Official Technology Notes

Google Antigravity is an agentic development environment that can work across editor, terminal and browser, and supports plans/artifacts and parallel agents. Its documentation also describes verification-oriented workflows.

Google Earth Engine provides APIs for geospatial data storage, analysis and visualization.

NASA Worldview/GIBS can be investigated for official satellite imagery and near-real-time Earth observation products.

Always verify provider licensing, usage limits, attribution, authentication and exact data freshness before production deployment.
