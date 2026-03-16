# Changelog

## [Unreleased] - 2026-03-16

### Fixed
- Fixed `AttributeError: 'StudentProfile' object has no attribute 'interests'` in `backend/ai_service.py`.
- Restored `backend/main.py` from corruption and resolved syntax errors.
- Refined `CORSMiddleware` origins in `backend/main.py` to fix "Network Error" in browsers when sending credentials.
- **Optimized Loading Speeds**: Implemented asynchronous API calls and parallel execution to significantly reduce syllabus and chapter load times.

### Added
- Added `/health` endpoint in `backend/main.py` for server diagnostics.
- Added response caching for frequently accessed chapter and topic content.
- **Progress Analytics**: Added a dedicated `ProgressTracker` page with 3D-styled visualizations for curriculum mastery and learning velocity.
- **Dashboard Summary**: Integrated a "Quick Stats" section on the main dashboard for immediate status updates.
