# MANUS Platform Testing Guide

## Testing Overview

This guide provides comprehensive testing procedures for the MANUS luxury menswear platform. Follow these steps to ensure all features work correctly before deployment.

## Pre-Testing Setup

### 1. Environment Preparation
- [ ] Verify all environment variables are set correctly
- [ ] Confirm Supabase integration is active
- [ ] Check Resend email service configuration
- [ ] Ensure all SQL scripts (01-17) have been executed
- [ ] Verify admin user is created and accessible

### 2. Database Verification
\`\`\`sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify admin user exists
SELECT email, role FROM user_profiles 
WHERE role = 'admin';
\`\`\`

## Core Feature Testing

### 🔐 Authentication System

#### What to Test:
- [ ] User registration with email/password
- [ ] Email confirmation process
- [ ] User login functionality
- [ ] Password reset flow
- [ ] Session persistence
- [ ] Logout functionality

#### How to Test:
1. **Registration**: Navigate to `/auth/sign-up`
   - Enter valid email and password
   - Check for confirmation email
   - Verify account activation
   
2. **Login**: Navigate to `/auth/login`
   - Use registered credentials
   - Verify successful authentication
   - Check user session persistence

3. **Password Reset**: 
   - Request password reset
   - Check email delivery
   - Complete reset process

#### Expected Results:
- Successful account creation and activation
- Secure login/logout functionality
- Email notifications working correctly

### 🛍️ E-Commerce Features

#### What to Test:
- [ ] Product catalog browsing
- [ ] Search and filtering
- [ ] Product detail pages
- [ ] Add to cart functionality
- [ ] Shopping cart management
- [ ] Checkout process
- [ ] Order confirmation
- [ ] Order history

#### How to Test:
1. **Product Browsing**:
   - Navigate to homepage
   - Test category filters
   - Use search functionality
   - Check product sorting options

2. **Shopping Flow**:
   - Add products to cart
   - Modify cart quantities
   - Proceed to checkout
   - Enter shipping/billing addresses
   - Complete order placement

3. **Order Management**:
   - Check order confirmation email
   - Navigate to `/orders`
   - Verify order details and status

#### Expected Results:
- Smooth product discovery experience
- Accurate cart calculations
- Successful order processing
- Email confirmations sent

### 👔 Wardrobe Management

#### What to Test:
- [ ] Add wardrobe items
- [ ] Categorize clothing
- [ ] Edit/delete wardrobe items
- [ ] Wardrobe organization
- [ ] Integration with recommendations

#### How to Test:
1. **Wardrobe Setup**:
   - Navigate to `/wardrobe`
   - Add various clothing items
   - Test different categories (shirts, pants, shoes)
   - Upload item images

2. **Organization**:
   - Filter by category
   - Search wardrobe items
   - Edit item details
   - Delete items

#### Expected Results:
- Easy wardrobe item management
- Proper categorization
- Accurate item storage and retrieval

### 🤖 AI Recommendations

#### What to Test:
- [ ] Product recommendations based on wardrobe
- [ ] Outfit suggestions
- [ ] Style compatibility analysis
- [ ] Recommendation accuracy

#### How to Test:
1. **Recommendations Page**:
   - Navigate to `/recommendations`
   - Review suggested products
   - Check outfit combinations
   - Test "Add to Cart" from recommendations

2. **Product Integration**:
   - View product detail pages
   - Check "Style with your wardrobe" section
   - Verify compatibility suggestions

#### Expected Results:
- Relevant product recommendations
- Logical outfit combinations
- Clear styling suggestions

### 🎨 Outfit Planner

#### What to Test:
- [ ] Create new outfits
- [ ] Combine wardrobe + product items
- [ ] Save outfit combinations
- [ ] Share outfits publicly
- [ ] Browse public outfit gallery

#### How to Test:
1. **Outfit Creation**:
   - Navigate to `/outfit-planner`
   - Select items from wardrobe
   - Add MANUS products
   - Save complete outfit

2. **Outfit Management**:
   - Edit saved outfits
   - Delete outfits
   - Share outfits publicly
   - Browse `/inspiration` page

#### Expected Results:
- Intuitive outfit building interface
- Successful outfit saving
- Public sharing functionality

### ❤️ Wishlist System

#### What to Test:
- [ ] Add products to wishlist
- [ ] Remove from wishlist
- [ ] Wishlist page functionality
- [ ] Move from wishlist to cart

#### How to Test:
1. **Wishlist Operations**:
   - Click heart icons on product cards
   - Navigate to `/wishlist`
   - Remove items from wishlist
   - Add wishlist items to cart

#### Expected Results:
- Smooth wishlist management
- Persistent wishlist data
- Easy cart conversion

### 📧 Email Notifications

#### What to Test:
- [ ] Order confirmation emails
- [ ] Welcome emails for new users
- [ ] Shipping update notifications
- [ ] Style recommendation emails

#### How to Test:
1. **Email Triggers**:
   - Complete an order (check confirmation email)
   - Register new account (check welcome email)
   - Admin: Update order to "shipped" (check shipping email)

2. **Email Content**:
   - Verify email formatting
   - Check all links work
   - Confirm branding consistency

#### Expected Results:
- All emails delivered successfully
- Professional email templates
- Working links and formatting

### 👨‍💼 Admin Dashboard

#### What to Test:
- [ ] Admin authentication
- [ ] Product management
- [ ] Order processing
- [ ] Inventory management
- [ ] User management
- [ ] Analytics dashboard

#### How to Test:
1. **Admin Access**:
   - Login with admin credentials
   - Navigate to `/admin`
   - Verify admin-only features visible

2. **Product Management**:
   - Add new products
   - Edit existing products
   - Update inventory levels
   - Set low stock alerts

3. **Order Management**:
   - View all orders
   - Update order status
   - Process returns/refunds
   - Send shipping notifications

#### Expected Results:
- Secure admin access
- Full administrative control
- Accurate data management

### 💳 Address Management

#### What to Test:
- [ ] Save addresses during checkout
- [ ] Manage saved addresses
- [ ] Set default addresses
- [ ] Address selection in checkout

#### How to Test:
1. **Address Operations**:
   - Navigate to `/addresses`
   - Add new addresses
   - Set default addresses
   - Edit/delete addresses

2. **Checkout Integration**:
   - Start checkout process
   - Select from saved addresses
   - Add new address with save option

#### Expected Results:
- Persistent address storage
- Easy address management
- Seamless checkout integration

## Advanced Feature Testing

### 📊 Analytics & Reporting

#### What to Test:
- [ ] Sales analytics
- [ ] Customer insights
- [ ] Inventory reports
- [ ] Marketing campaign tracking

#### How to Test:
1. **Admin Analytics**:
   - Navigate to admin analytics section
   - Review sales charts and metrics
   - Check customer behavior data
   - Verify inventory reports

### 🔄 Return/Refund System

#### What to Test:
- [ ] Customer return requests
- [ ] Admin return processing
- [ ] Refund calculations
- [ ] Inventory restoration

#### How to Test:
1. **Return Process**:
   - Navigate to order history
   - Request return for eligible order
   - Admin: Process return request
   - Verify inventory updates

### 🎯 Marketing Tools

#### What to Test:
- [ ] Promotional codes
- [ ] Newsletter subscriptions
- [ ] Referral system
- [ ] Customer segmentation

#### How to Test:
1. **Promotional Features**:
   - Create promotional codes in admin
   - Apply codes during checkout
   - Test newsletter signup
   - Verify referral tracking

## Mobile Responsiveness Testing

### What to Test:
- [ ] Mobile navigation
- [ ] Touch interactions
- [ ] Responsive layouts
- [ ] Mobile checkout flow

### How to Test:
1. **Device Testing**:
   - Test on various screen sizes
   - Verify touch-friendly buttons
   - Check mobile navigation menu
   - Complete mobile purchase flow

## Performance Testing

### What to Test:
- [ ] Page load times
- [ ] Image optimization
- [ ] Database query performance
- [ ] API response times

### How to Test:
1. **Performance Metrics**:
   - Use browser dev tools
   - Check Core Web Vitals
   - Monitor API response times
   - Test with large datasets

## Security Testing

### What to Test:
- [ ] Authentication security
- [ ] Data access controls
- [ ] Input validation
- [ ] SQL injection prevention

### How to Test:
1. **Security Verification**:
   - Test unauthorized access attempts
   - Verify RLS policies work
   - Check input sanitization
   - Test admin-only features

## Post-Testing Actions

### ✅ When All Tests Pass:

1. **Documentation Update**:
   - [ ] Update README with any changes
   - [ ] Document any known issues
   - [ ] Update API documentation

2. **Deployment Preparation**:
   - [ ] Set production environment variables
   - [ ] Configure production database
   - [ ] Set up monitoring and logging
   - [ ] Configure backup systems

3. **Go-Live Checklist**:
   - [ ] Deploy to production environment
   - [ ] Run smoke tests on production
   - [ ] Monitor error logs
   - [ ] Set up analytics tracking
   - [ ] Configure email notifications
   - [ ] Test payment processing (if integrated)

4. **Post-Launch Monitoring**:
   - [ ] Monitor application performance
   - [ ] Track user registration and orders
   - [ ] Monitor email delivery rates
   - [ ] Check error rates and logs
   - [ ] Gather user feedback

### ❌ When Tests Fail:

1. **Issue Documentation**:
   - [ ] Document failing test cases
   - [ ] Identify root causes
   - [ ] Prioritize critical vs. minor issues

2. **Bug Fixing Process**:
   - [ ] Fix critical issues first
   - [ ] Re-run affected test cases
   - [ ] Perform regression testing
   - [ ] Update code and documentation

3. **Re-Testing**:
   - [ ] Run full test suite again
   - [ ] Verify all fixes work correctly
   - [ ] Check for new issues introduced

## Testing Tools & Resources

### Recommended Tools:
- **Browser Dev Tools**: Performance and debugging
- **Postman**: API testing
- **Lighthouse**: Performance auditing
- **Supabase Dashboard**: Database monitoring
- **Resend Dashboard**: Email delivery tracking

### Test Data:
- Use provided sample data from `02-seed-sample-data.sql`
- Create test user accounts for different scenarios
- Use test email addresses for email verification

## Support & Troubleshooting

### Common Issues:
1. **Authentication Errors**: Check Supabase configuration
2. **Email Not Sending**: Verify Resend API key
3. **Database Errors**: Ensure all migrations completed
4. **Admin Access**: Verify admin user creation script

### Getting Help:
- Check application logs for error details
- Review Supabase dashboard for database issues
- Verify environment variable configuration
- Test with fresh browser session/incognito mode

---

**Remember**: Thorough testing ensures a smooth user experience and successful platform launch. Take time to test each feature completely before proceeding to production deployment.
