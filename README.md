# MANUS - Luxury Menswear Platform

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/uscl-techs-projects/v0-ai-discussion)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/PhkOmnTthQU)

## Overview

MANUS is a revolutionary luxury menswear platform that combines e-commerce with intelligent wardrobe management and AI-powered styling recommendations. Unlike traditional fashion retailers, MANUS helps customers understand how new purchases integrate with their existing wardrobe, creating a complete style ecosystem.

## Core Concept

MANUS operates on a unique hybrid model:
- **Product Sales**: Curated luxury menswear collection
- **Wardrobe Integration**: Shows how products work with existing clothing
- **AI Styling**: Intelligent outfit recommendations and style guidance
- **Complete Ecosystem**: From discovery to purchase to styling

## Key Features

### 🛍️ E-Commerce Platform
- Curated luxury menswear catalog
- Advanced search and filtering
- Product reviews and ratings
- Wishlist and favorites system
- Secure checkout with address management
- Order tracking and history

### 👔 Wardrobe Management
- Digital wardrobe organization
- Clothing categorization and tagging
- Item photography and details
- Wardrobe analytics and insights

### 🤖 AI-Powered Recommendations
- Intelligent product suggestions based on existing wardrobe
- Color and style compatibility analysis
- Outfit generation combining owned items with new products
- Seasonal and occasion-based recommendations

### 🎨 Advanced Outfit Planner
- Visual outfit builder interface
- Drag-and-drop functionality
- Save and share outfit combinations
- Calendar integration for outfit planning

### 📧 Email Notifications
- Order confirmations and shipping updates
- Style recommendations and tips
- Welcome emails and account updates
- Marketing campaigns and newsletters

### 👨‍💼 Admin Dashboard
- Product and inventory management
- Order processing and fulfillment
- Customer management and analytics
- Return and refund processing
- Marketing tools and campaign management

### 📊 Analytics & Insights
- Sales performance tracking
- Customer behavior analysis
- Inventory optimization
- Marketing campaign effectiveness

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Server-side functionality
- **Supabase** - Database and authentication
- **PostgreSQL** - Relational database
- **Row Level Security** - Data protection

### Services
- **Resend** - Email delivery service
- **Vercel** - Deployment and hosting
- **Vercel Blob** - File storage

### Key Libraries
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icon library
- **date-fns** - Date utilities

## Database Schema

The platform uses a comprehensive PostgreSQL schema with the following key tables:

- **products** - Product catalog with inventory tracking
- **user_profiles** - Extended user information and preferences
- **wardrobe_items** - User's clothing inventory
- **orders & order_items** - E-commerce transactions
- **outfits & outfit_items** - Saved outfit combinations
- **recommendations** - AI-generated suggestions
- **customer_addresses** - Shipping and billing addresses
- **reviews** - Product reviews and ratings
- **wishlist** - Saved products
- **returns & refunds** - Return processing
- **promotional_codes** - Marketing campaigns
- **analytics_events** - User behavior tracking

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Resend account (for emails)

### Environment Variables
Create a `.env.local` file with the following variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd manus-platform
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL scripts in order (01-17) from the `scripts/` folder
   - Configure authentication settings

4. **Configure Resend**
   - Create a Resend account
   - Add your API key to environment variables
   - Verify your sending domain

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Create admin user**
   - Run script `14-fix-admin-user.sql` with your email
   - Or manually set role to 'admin' in user_profiles table

## Usage Guide

### For Customers

1. **Account Setup**
   - Register with email/password
   - Complete profile with size preferences
   - Add existing wardrobe items

2. **Shopping Experience**
   - Browse curated product catalog
   - Use AI recommendations based on wardrobe
   - See how products integrate with existing items
   - Add to cart and checkout securely

3. **Wardrobe Management**
   - Organize clothing by category
   - Create and save outfit combinations
   - Get styling suggestions and tips

4. **Order Management**
   - Track order status and shipping
   - Request returns if needed
   - Leave product reviews

### For Administrators

1. **Product Management**
   - Add new products with details and images
   - Manage inventory levels and stock alerts
   - Set pricing and promotional offers

2. **Order Processing**
   - View and process customer orders
   - Update shipping status
   - Handle returns and refunds

3. **Analytics & Insights**
   - Monitor sales performance
   - Analyze customer behavior
   - Track inventory turnover
   - Measure marketing effectiveness

## API Documentation

### Authentication
All user-specific endpoints require authentication via Supabase Auth.

### Key Endpoints

#### Products
- `GET /api/products` - List products with filtering
- `GET /api/products/[id]` - Get product details
- `POST /api/products` - Create product (admin only)

#### Cart & Orders
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `POST /api/checkout` - Process order
- `GET /api/orders` - Get user's orders

#### Wardrobe
- `GET /api/wardrobe` - Get user's wardrobe
- `POST /api/wardrobe` - Add wardrobe item

#### Recommendations
- `GET /api/recommendations` - Get AI recommendations
- `POST /api/recommendations` - Generate new recommendations

## Design System

### Colors
- **Primary**: Cyan (#06b6d4) - Modern, fresh, trustworthy
- **Secondary**: Green (#10b981) - Growth, harmony, balance
- **Neutrals**: Sophisticated grays and whites
- **Accent**: Warm tones for energy and calls-to-action

### Typography
- **Headings**: Montserrat (modern, geometric)
- **Body**: Open Sans (readable, friendly)
- **Hierarchy**: Clear size progression with proper line heights

### Layout Principles
- Mobile-first responsive design
- Generous whitespace for luxury feel
- Consistent spacing and alignment
- Touch-friendly interactive elements

## Testing

Refer to `test.md` for comprehensive testing procedures covering:
- Authentication and user management
- E-commerce functionality
- Wardrobe and outfit features
- Admin dashboard operations
- Email notifications
- Mobile responsiveness
- Performance and security

## Deployment

Your project is live at:
**[https://vercel.com/uscl-techs-projects/v0-ai-discussion](https://vercel.com/uscl-techs-projects/v0-ai-discussion)**

### Production Checklist
- [ ] Set production environment variables
- [ ] Run all database migrations
- [ ] Configure email service
- [ ] Set up monitoring and logging
- [ ] Test all critical user flows
- [ ] Configure backup systems

## Contributing

Continue building your app on:
**[https://v0.app/chat/projects/PhkOmnTthQU](https://v0.app/chat/projects/PhkOmnTthQU)**

## Architecture Highlights

### Unique Value Propositions
1. **Wardrobe Integration**: Unlike traditional e-commerce, shows how purchases work with existing clothing
2. **AI Styling**: Intelligent recommendations based on personal wardrobe analysis
3. **Complete Ecosystem**: From discovery to purchase to ongoing style management
4. **Luxury Experience**: Premium design and personalized service

### Technical Innovations
- Polymorphic database relationships for flexible item associations
- AI-powered color and style compatibility algorithms
- Real-time inventory management with low-stock alerts
- Comprehensive email automation system
- Advanced analytics and customer segmentation

## Support

For technical issues or questions:
- Check the testing guide in `test.md`
- Review Supabase dashboard for database issues
- Verify environment variable configuration
- Monitor application logs for error details

---

**MANUS** - Where luxury menswear meets intelligent styling. Transform how customers discover, purchase, and style their wardrobe with AI-powered recommendations and seamless wardrobe integration.
