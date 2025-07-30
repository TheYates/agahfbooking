# Database Setup Guide

This guide will help you set up PostgreSQL database connection for the AGAHF Booking System.

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database server running
   - Local installation: Download from [postgresql.org](https://www.postgresql.org/download/)
   - Cloud options: AWS RDS, Google Cloud SQL, Heroku Postgres, Supabase, etc.

## Setup Steps

### 1. Configure Environment Variables

Edit the `.env.local` file in your project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/booking_db"

# Alternative individual database settings (if not using DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=booking_db
DB_USER=your_username
DB_PASSWORD=your_password
```

**Replace the placeholder values:**

- `your_username`: Your PostgreSQL username
- `your_password`: Your PostgreSQL password
- `localhost`: Your database host (if using cloud database)
- `5432`: Your database port (if different)
- `booking_db`: Your database name

### 2. Create Database

Connect to your PostgreSQL server and create the database:

```sql
CREATE DATABASE booking_db;
```

### 3. Initialize Database Schema

Run the database initialization script:

```bash
npm run db:init
```

This will:

- Connect to your database
- Create all required tables
- Insert sample data
- Verify the setup

### 4. Test Database Connection

Start your development server:

```bash
npm run dev
```

Then test the database connection:

```bash
npm run db:test
```

Or visit: http://localhost:3000/api/test-db

## Database Schema Overview

The database includes these main tables:

- **users**: Client, receptionist, and admin accounts
- **departments**: Medical departments/specializations (Cardiology, Pediatrics, etc.)
- **doctors**: Doctor information linked to departments
- **appointments**: Booking records with department and optional doctor assignment
- **department_availability**: Daily availability settings per department
- **system_settings**: Configurable application settings
- **otp_codes**: One-time passwords for authentication
- **appointment_statuses**: Status types with colors

## API Endpoints

Once set up, you can use these API endpoints:

- `GET /api/test-db` - Test database connection
- `GET /api/departments` - Get all departments
- `GET /api/departments?date=2024-01-15` - Get departments with availability
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors?departmentId=1` - Get doctors by department
- `GET /api/appointments` - Get appointments
- `GET /api/appointments?departmentId=1&date=2024-01-15` - Get appointments by department
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/available-slots?departmentId=1&date=2024-01-15` - Get available slots

## Troubleshooting

### Connection Issues

1. **Check credentials**: Verify username, password, and database name
2. **Check host/port**: Ensure PostgreSQL is running on the specified host/port
3. **Check firewall**: Ensure the database port is accessible
4. **Check SSL**: Some cloud databases require SSL connections

### Common Errors

- **"database does not exist"**: Create the database first
- **"role does not exist"**: Create the PostgreSQL user
- **"connection refused"**: PostgreSQL server is not running
- **"authentication failed"**: Check username/password

### Sample Local Setup Commands

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE DATABASE booking_db;
CREATE USER booking_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE booking_db TO booking_user;

# Exit psql
\q
```

Then update your `.env.local`:

```env
DATABASE_URL="postgresql://booking_user:your_password@localhost:5432/booking_db"
```

## Production Considerations

1. **Use connection pooling**: Already configured in `lib/db.ts`
2. **Set proper connection limits**: Adjust pool settings based on your needs
3. **Use SSL in production**: Add `?sslmode=require` to DATABASE_URL
4. **Monitor connections**: Keep track of active connections
5. **Backup regularly**: Set up automated database backups

## Next Steps

After successful database setup:

1. The Quick Booking dialog will connect to real data
2. You can create appointments through the UI
3. All data will persist in PostgreSQL
4. You can extend the API endpoints as needed

For any issues, check the console logs and database connection settings.
