# MANUS Platform - Technical Documentation

## Project Overview

MANUS is a comprehensive social commerce platform that combines fashion inspiration, product discovery, and e-commerce functionality. The platform allows users to create outfit inspirations, tag products, manage wishlists, and make purchases while providing administrators with powerful management tools.

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Storage**: Supabase Storage for image uploads
- **Currency**: Indian Rupees (INR) throughout the platform

### Core Features
- User authentication with role-based access control
- Social commerce with outfit inspirations
- Product catalog with advanced search and filtering
- Shopping cart and wishlist functionality
- Admin dashboard with comprehensive management tools
- Image upload and compression system
- Real-time analytics and reporting

## Database Schema

### Core Tables

#### Users & Authentication
- `user_profiles`: Extended user information with roles (user, moderator, admin)
- `auth.users`: Supabase auth users (managed by Supabase)

#### Products & Catalog
- `products`: Product catalog with pricing, categories, and inventory
- `categories`: Hierarchical category system with parent-child relationships
- `product_images`: Multiple images per product support

#### Social Commerce
- `outfit_inspirations`: User-generated outfit posts
- `outfit_inspiration_items`: Tagged products within inspirations
- `inspiration_additional_images`: Multiple images per inspiration

#### E-commerce
- `orders`: Order management with status tracking
- `order_items`: Individual items within orders
- `cart_items`: Shopping cart persistence
- `wishlists`: User wishlist functionality

#### System
- `platform_settings`: Configurable platform settings
- Storage buckets: `images` for user uploads

### Key Relationships
- `user_profiles.user_id` → `auth.users.id`
- `orders.user_id` → `user_profiles.user_id`
- `products.category_id` → `categories.id`
- `outfit_inspirations.user_id` → `user_profiles.user_id`

## Authentication System

### Implementation
- **Server-side**: Supabase SSR with proper cookie handling
- **Client-side**: Supabase client with auto-refresh tokens
- **Middleware**: Token refresh and route protection
- **RLS Policies**: Row-level security for data access control

### Role-based Access Control
- **User**: Basic platform access, create inspirations, shopping
- **Moderator**: Content moderation capabilities
- **Admin**: Full platform management access

### Key Functions
- `getUser()`: Get current authenticated user
- `getUserProfile()`: Get user profile with automatic creation
- `requireAuth()`: Require authentication for routes
- `requireAdmin()`: Require admin role for admin routes
- `isAdmin()`: Check if user has admin privileges

## Admin Dashboard

### Core Features
- **Dashboard Overview**: Key metrics, recent activity, system health
- **User Management**: User roles, analytics, bulk operations
- **Product Management**: CRUD operations, bulk updates, inventory tracking
- **Order Management**: Order processing, status updates, export functionality
- **Category Management**: Hierarchical category creation and management
- **Settings**: Platform configuration and customization

### API Endpoints
- `/api/admin/stats` - Dashboard statistics
- `/api/admin/users` - User management
- `/api/admin/products` - Product management
- `/api/admin/orders` - Order management
- `/api/admin/categories` - Category management
- `/api/admin/settings` - Platform settings

## Image Upload System

### Features
- **Automatic Compression**: Images compressed before upload
- **Multiple Images**: Support for multiple images per inspiration
- **Storage Buckets**: Organized file storage with proper permissions
- **Error Handling**: Graceful fallbacks for upload failures
- **RLS Policies**: Secure access control for uploaded images

### Implementation
- Bucket: `images` with public read access
- User-specific folders: `{user_id}/inspirations/`
- Compression: Client-side image optimization
- Fallback: Placeholder images for failed uploads

## Currency System

### Implementation
- **Base Currency**: Indian Rupees (INR)
- **Formatting**: Centralized currency utility (`lib/utils/currency.ts`)
- **Display**: ₹ symbol with proper Indian number formatting
- **Database**: All prices stored in INR (converted from USD at ~83:1 rate)

### Key Functions
- `formatCurrency(amount)`: Format amount as INR
- `formatCurrencyCompact(amount)`: Compact formatting (₹1.2K)
- `parseCurrency(formatted)`: Parse formatted currency back to number

## API Architecture

### Authentication APIs
- `/api/auth/*` - Authentication endpoints
- Server actions for login/signup in `lib/actions.ts`

### Public APIs
- `/api/products` - Product catalog
- `/api/categories` - Category listing
- `/api/recommendations` - Product recommendations
- `/api/trending` - Trending data

### Protected APIs
- `/api/cart` - Shopping cart management
- `/api/wishlist` - Wishlist operations
- `/api/orders` - Order creation and tracking

### Admin APIs
- `/api/admin/*` - Administrative functions
- Require admin authentication
- Comprehensive CRUD operations

## Frontend Components

### Core Components
- `components/auth/` - Authentication forms
- `components/admin/` - Admin dashboard components
- `components/product-card.tsx` - Product display
- `components/inspiration/` - Social commerce features
- `components/cart/` - Shopping cart functionality

### Admin Components
- `AdminStats` - Dashboard overview
- `UserManagement` - User administration
- `ProductManagement` - Product CRUD operations
- `OrderManagement` - Order processing
- `CategoryManagement` - Category hierarchy management

## Change Log

### Phase 1: Initial Platform Setup
- ✅ Basic Next.js application structure
- ✅ Supabase integration and authentication
- ✅ Core database schema design
- ✅ Basic user interface components

### Phase 2: Social Commerce Features
- ✅ Outfit inspiration creation and display
- ✅ Product tagging system
- ✅ Image upload and storage
- ✅ User profiles and social features

### Phase 3: E-commerce Integration
- ✅ Shopping cart functionality
- ✅ Order management system
- ✅ Payment integration preparation
- ✅ Wishlist functionality

### Phase 4: Admin Dashboard Development
- ✅ Comprehensive admin interface
- ✅ User management with role-based access
- ✅ Product management with bulk operations
- ✅ Order processing and tracking
- ✅ Analytics and reporting dashboard
- ✅ Category management system
- ✅ Platform settings configuration

### Phase 5: System Optimization & Bug Fixes
- ✅ Authentication system overhaul
- ✅ Database relationship optimization
- ✅ RLS policy improvements
- ✅ Image upload system enhancement
- ✅ Currency conversion to INR
- ✅ API error handling improvements
- ✅ Performance optimizations

## Technical Improvements Made

### Authentication Fixes
- Fixed refresh token handling issues
- Improved session management
- Enhanced middleware for route protection
- Resolved infinite recursion in RLS policies
- Added automatic user profile creation

### Database Optimizations
- Added proper foreign key constraints
- Improved table relationships
- Enhanced RLS policies for security
- Added database indexes for performance
- Created idempotent migration scripts

### API Enhancements
- Standardized error handling across all endpoints
- Added comprehensive logging for debugging
- Improved authentication checks
- Enhanced data validation
- Added bulk operation support

### Frontend Improvements
- Centralized currency formatting
- Enhanced error handling and user feedback
- Improved loading states and UX
- Added comprehensive admin interfaces
- Optimized component performance

## Security Measures

### Row Level Security (RLS)
- All tables protected with appropriate RLS policies
- User data isolation
- Admin-only access for sensitive operations
- Secure file upload permissions

### Authentication Security
- Secure token handling
- Automatic session refresh
- Protected route middleware
- Role-based access control

### Data Validation
- Server-side input validation
- SQL injection prevention
- XSS protection
- File upload security

## Performance Optimizations

### Database
- Proper indexing on foreign keys
- Optimized queries with selective joins
- Connection pooling
- Query result caching

### Frontend
- Component lazy loading
- Image optimization and compression
- Efficient state management
- Minimal re-renders

### API
- Response caching where appropriate
- Efficient data fetching
- Bulk operations for admin tasks
- Proper error boundaries

## Future Development Recommendations

### Phase 6: Advanced Features
- [ ] Real-time notifications system
- [ ] Advanced search with filters
- [ ] Social features (following, likes, comments)
- [ ] Mobile app development
- [ ] Advanced analytics dashboard

### Phase 7: Scaling & Performance
- [ ] CDN integration for images
- [ ] Advanced caching strategies
- [ ] Database optimization for scale
- [ ] Load balancing considerations
- [ ] Monitoring and alerting system

### Phase 8: Business Features
- [ ] Multi-vendor marketplace
- [ ] Advanced payment options
- [ ] Inventory management automation
- [ ] Customer service integration
- [ ] Marketing automation tools

## Deployment & Environment

### Environment Variables Required
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase key
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Development redirect URL

### Database Scripts Execution Order
1. `scripts/44-idempotent-database-relationships.sql`
2. `scripts/45-idempotent-currency-conversion.sql`
3. `scripts/46-idempotent-rls-policies.sql`

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database scripts executed
- [ ] Storage buckets created
- [ ] RLS policies applied
- [ ] Admin user created
- [ ] Platform settings configured

## Troubleshooting Guide

### Common Issues
1. **Authentication Errors**: Check token refresh configuration
2. **Database Relationship Errors**: Ensure foreign keys are properly set
3. **Image Upload Failures**: Verify storage bucket policies
4. **Admin Access Issues**: Confirm user role assignments
5. **Currency Display Problems**: Check currency utility imports

### Debug Tools
- Console logging with `[v0]` prefix for identification
- Database query logging in API endpoints
- Authentication state debugging in middleware
- Error boundary components for graceful error handling

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Platform Version**: MANUS v1.0  
**Next Review**: Before Phase 6 development
