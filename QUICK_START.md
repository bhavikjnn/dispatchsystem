# Quick Start Guide - Order Dispatch System

Get up and running in 5 minutes!

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Environment
Create `.env.local` in the project root:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/order-dispatch
JWT_SECRET=your-secret-key-here
```

**MongoDB Atlas Setup:**
- Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- Create a free account
- Create a new cluster
- Get connection string and replace username/password
- Add your IP to whitelist

## Step 3: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Step 4: Create Admin Account
1. Click "Sign Up"
2. Fill in your details
3. Submit
4. You'll be assigned the Admin role automatically

## Step 5: Seed Sample Data
```bash
npm run seed
```
This adds 8 sample orders to your database.

## Step 6: Login & Explore
1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Enter your credentials
3. Explore the admin dashboard with pre-populated sample data!

## What to Try

### As an Admin:
✅ View all 8 sample orders
✅ Filter by company name (e.g., "Paras Polymers")
✅ Filter by destination (e.g., "Delhi")
✅ Configure field visibility
✅ Download filtered data
✅ Check audit logs

### As an Employee:
✅ Create a new order
✅ View your submitted orders
✅ Download your orders as CSV

## Sample Companies in Data

1. **Paras Polymers** - Delhi
2. **PN Safetech Private Limited** - Nadarganj
3. **SLK Food Processing** - Kozhikode
4. **TechFlow Solutions** - Bangalore
5. **Global Imports Ltd** - Mumbai
6. **Green Logistics** - Pune
7. **Quantum Industries** - Chennai
8. **Premium Traders** - Hyderabad

## Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
npm run seed         # Populate sample data
npm run lint         # Check code quality
```

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review [SETUP.md](SETUP.md) for advanced setup options
- Check browser console (F12) for error messages
- Verify MongoDB connection in `.env.local`

## Next Steps

1. ✅ Explore the UI with sample data
2. ⬜ Create your own admin account
3. ⬜ Create a few test orders as employee
4. ⬜ Configure field visibility as admin
5. ⬜ Export data and check audit logs
6. ⬜ Deploy to production when ready

Happy dispatching! 🚀
