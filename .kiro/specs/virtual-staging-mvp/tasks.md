# Implementation Plan

- [x] 1. Set up core database schema and authentication integration
  - Extend Convex schema with users, projects, images, stagingJobs, subscriptions, and creditTransactions tables
  - Configure Clerk authentication with user creation hooks
  - Create basic user profile management functions
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 2. Implement project management system
  - Create project CRUD operations in Convex
  - Build ProjectDashboard component with grid view of projects
  - Implement ProjectCreator form for new project creation
  - Add project status management and basic project settings
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Set up Cloudflare R2 integration and image upload system
  - Configure Cloudflare R2 client and signed URL generation
  - Create image upload Convex functions with R2 storage
  - Build ImageUploader component with drag-and-drop interface
  - Implement upload progress tracking and error handling
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [x] 4. Implement intelligent room type detection
  - Create filename parsing logic for room type hints
  - Build AI heuristics for structural feature detection
  - Implement fallback suggestion system with user override
  - Add room type tagging interface to uploaded images
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 5. Integrate Gemini 2.5 Flash Image API for AI staging
  - Set up Gemini API client and authentication
  - Create staging job queue system in Convex
  - Implement AI staging functions with style preset support
  - Add error handling and retry logic for AI processing
  - _Requirements: 4.1, 4.3, 4.7_

- [x] 6. Build batch processing and style consistency system
  - Create batch selection interface for multiple images
  - Implement style palette options (Minimal, Scandinavian, Bohemian, Modern, Traditional)
  - Add consistent styling across selected images in a batch
  - Build staging progress tracking and queue management
  - _Requirements: 4.2, 4.1_

- [x] 7. Implement MLS compliance features
  - Add automatic watermarking system for staged images
  - Create dual export functionality (staged + original versions)
  - Implement structural preservation validation
  - Build compliance checking and warning system
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Create image review and approval system
  - Build before/after comparison interface with interactive sliders
  - Implement image approval workflow with regeneration options
  - Create detailed image viewer with metadata display
  - Add gallery view for project image management
  - _Requirements: 6.1, 6.2, 4.4, 4.6_

- [x] 9. Build export and download system
  - Create export manager with multiple resolution options
  - Implement MLS-ready format generation (1024x768, 1200x800, high-res)
  - Add batch download functionality with organized file naming
  - Build download center with export history tracking
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 10. Implement credit system and Stripe integration
  - Create credit tracking and deduction logic
  - Integrate Stripe for subscription management
  - Build billing dashboard and plan upgrade flows
  - Implement credit notifications and purchase prompts
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 1.2_

- [ ] 11. Add comprehensive error handling and user feedback
  - Implement global error boundary and user-friendly error messages
  - Create retry mechanisms for failed operations
  - Add loading states and progress indicators throughout the app
  - Build notification system for success/error feedback
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Create responsive UI components and layouts
  - Build responsive dashboard layout with navigation
  - Implement mobile-friendly image upload and review interfaces
  - Create consistent component library using shadcn/ui
  - Add proper loading states and skeleton components
  - _Requirements: All UI-related requirements_

- [ ] 13. Implement user onboarding and trial experience
  - Create guided onboarding flow for new users
  - Build trial credit allocation and tracking
  - Implement first-time user experience with sample projects
  - Add tooltips and help text for key features
  - _Requirements: 1.3, 7.1_

- [ ] 14. Add comprehensive testing suite
  - Write unit tests for Convex functions and utilities
  - Create integration tests for image upload and AI processing flows
  - Implement end-to-end tests for critical user journeys
  - Add performance tests for batch processing and large file uploads
  - _Requirements: All requirements (testing coverage)_

- [ ] 15. Optimize performance and add monitoring
  - Implement image optimization and lazy loading
  - Add database query optimization and proper indexing
  - Create performance monitoring and error tracking
  - Optimize bundle size and implement code splitting
  - _Requirements: Performance aspects of all requirements_

- [ ] 16. Final integration and deployment preparation
  - Configure production environment variables and secrets
  - Set up CI/CD pipeline with automated testing
  - Implement proper logging and monitoring
  - Create deployment scripts and database migration procedures
  - _Requirements: All requirements (production readiness)_
