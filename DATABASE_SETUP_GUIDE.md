# 🗄️ Database Setup Guide for AGAHF Booking System

## 📋 Prerequisites

You need a PostgreSQL database. Choose one of these options:

### Option 1: Local PostgreSQL Installation
- Download from [postgresql.org](https://www.postgresql.org/download/)
- Install and start the PostgreSQL service
- Default port: 5432

### Option 2: Cloud Database (Recommended for Production)
- **Supabase**: Free tier available, easy setup
- **AWS RDS**: Production-ready, scalable
- **Google Cloud SQL**: Reliable cloud option
- **Heroku Postgres**: Simple deployment

## 🚀 Quick Setup Steps

### Step 1: Configure Database Connection

Edit `.env.local` file in your project root:

```env
# Replace with your actual database credentials
DATABASE_URL="postgresql://your_username:your_password@your_host:5432/your_database_name"

# Alternative individual settings (if not using DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agahf_booking
DB_USER=your_username
DB_PASSWORD=your_password
```

### Step 2: Create Database

Connect to PostgreSQL and create the database:

```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE agahf_booking;
CREATE USER booking_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE agahf_booking TO booking_user;
```

### Step 3: Initialize Database Schema

Run the initialization script:

```bash
npm run db:init
```

This will:
- ✅ Create all required tables
- ✅ Insert sample data (departments, users, settings)
- ✅ Set up indexes for performance
- ✅ Verify the setup

### Step 4: Test Database Connection

```bash
npm run db:test
```

Or visit: http://localhost:3000/api/test-db

## 📊 Database Schema Overview

### Core Tables

1. **users** - Client, receptionist, and admin accounts
2. **departments** - Medical departments with color coding
3. **doctors** - Doctor information linked to departments
4. **appointments** - Booking records
5. **department_availability** - Daily availability settings
6. **system_settings** - Configurable application settings
7. **otp_codes** - One-time passwords for authentication
8. **appointment_statuses** - Status types with colors

### Key Features

- **Department Color Coding**: Each department has a unique color for UI
- **Flexible Scheduling**: Slot-based system with configurable working hours
- **Role-Based Access**: Client, receptionist, and admin roles
- **OTP Authentication**: Secure login with one-time passwords
- **Audit Trail**: Created/updated timestamps on all records

## 🔧 Migration Scripts

If you have an existing database, run these migrations:

```bash
# Add working schedule to departments (if needed)
psql -d your_database -f scripts/002-add-working-schedule.sql

# Add color field to departments
psql -d your_database -f scripts/003-add-department-color.sql
```

## 🧪 Sample Data

The initialization includes:

### Sample Departments
- **General Medicine** (Blue) - 15 slots/day
- **Cardiology** (Red) - 10 slots/day  
- **Pediatrics** (Green) - 12 slots/day
- **Orthopedics** (Purple) - 8 slots/day
- **Dermatology** (Orange) - 10 slots/day
- **Gynecology** (Pink) - 10 slots/day
- **Ophthalmology** (Cyan) - 12 slots/day
- **ENT** (Lime) - 8 slots/day

### Sample Users
- **Client**: X12345/67 (John Doe)
- **Receptionist**: R00001/00 (Mary Johnson)
- **Admin**: A00001/00 (Dr. Admin)

## 🔍 Troubleshooting

### Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -p 5432 -U your_username -d your_database
```

### Permission Issues
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO booking_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO booking_user;
```

### Reset Database
```bash
# Drop and recreate (WARNING: This deletes all data)
DROP DATABASE agahf_booking;
CREATE DATABASE agahf_booking;
npm run db:init
```

## 🚀 Next Steps

After successful database setup:

1. ✅ **Start the application**: `npm run dev`
2. ✅ **Test the calendar**: Visit http://localhost:3000/dashboard/calendar
3. ✅ **Create departments**: Visit http://localhost:3000/dashboard/departments
4. ✅ **Test appointments**: Book and manage appointments
5. ✅ **Configure settings**: Adjust system settings as needed

## 📞 Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify database credentials in `.env.local`
3. Ensure PostgreSQL service is running
4. Check firewall settings for database port access
