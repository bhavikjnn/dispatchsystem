# Order Dispatch Management System - Setup Guide

## Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/order-dispatch
   JWT_SECRET=your-secret-key-here
   ```

## Database Setup

### Seed Sample Data

To populate the database with sample orders from the provided data:

```bash
npm run seed
```

This will:
- Connect to MongoDB
- Clear existing sample data
- Insert 8 sample orders with realistic company data from the provided spreadsheet
- Verify the insertion

### Manual MongoDB Setup (Optional)

If you want to create collections manually:

```javascript
// In MongoDB:
db.createCollection("orders")
db.createCollection("users")
db.createCollection("field-visibility")
db.createCollection("audit-logs")
```

## Running the Application

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

## First Time Setup

1. **Create an Admin User**
   - Go to `/register`
   - Create a new account (first user will be admin)
   - Login with credentials

2. **Seed Sample Data**
   - Run `npm run seed` to populate sample orders

3. **Configure Field Visibility** (Optional)
   - Go to Admin Dashboard → Visibility tab
   - Customize which fields employees can see
   - Default: All fields are visible

## Features

### Employee Dashboard
- Create new dispatch orders
- View personal orders
- Download orders as CSV
- See only configured visible fields

### Admin Dashboard
- View all orders
- Advanced filtering (company, destination, date range, payment status, booking type)
- Configure field visibility for all employees
- View audit logs of all downloads
- Export filtered data as CSV

### Data Fields

The system tracks 16 fields per order:
- Company Name
- Contact Person
- Contact Number
- Email
- Order Reference
- Destination
- Invoice Number
- Invoice Date
- Item Description
- Rate (₹)
- Quantity
- Amount (₹)
- Transporter Name
- Paid or To Pay
- Booking Type
- Payment Details

## Sample Data

The seed script includes 8 sample orders from companies like:
- Paras Polymers
- PN Safetech Private Limited
- SLK Food Processing
- TechFlow Solutions
- Global Imports Ltd
- Green Logistics
- Quantum Industries
- Premium Traders

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check network access is allowed in MongoDB Atlas
- Ensure the database name is `order-dispatch`

### Authentication Issues
- Clear browser cookies and try logging in again
- Check that `JWT_SECRET` is set in environment variables

### Filter Not Working
- Ensure you have data seeded with `npm run seed`
- Filters are case-insensitive for text fields
- Admin users only can filter and see filter options

## Support

For issues or questions, please refer to the code comments and inline documentation.
