# 🔐 Staff Password Authentication Setup Complete!

## ✅ What Was Implemented

1. **Password Hashing** - Using bcrypt (industry standard)
2. **Secure Storage** - Passwords stored as hashes in database
3. **Staff Login** - Employee ID + Password authentication
4. **Database Column** - `password_hash` added to users table

---

## 🚀 Setup Instructions (5 minutes)

### Step 1: Add password_hash Column to Database

Go to Supabase SQL Editor:
https://supabase.com/dashboard/project/fzaxgisyvkblwafeoxib/editor

Run this SQL:
```sql
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_users_employee_id 
  ON public.users(employee_id);
```

### Step 2: Set Passwords for Staff Users

Run the password setup script:
```bash
npx tsx scripts/set-staff-passwords.ts
```

This will:
- Hash passwords securely
- Update all staff users
- Display login credentials

---

## 🔑 Default Credentials

After running the setup script:

### Admin Users:
- **Employee ID**: `ADMIN001`
- **Password**: `admin123`

### Receptionist Users:
- **Employee ID**: `REC001` or `REC002`
- **Password**: `reception123`

⚠️ **IMPORTANT**: Change these passwords in production!

---

## 🧪 Test Staff Login

1. Go to: http://localhost:3001/staff-login
2. Enter:
   - Employee ID: `ADMIN001`
   - Password: `admin123`
3. Click "Login"
4. You should be redirected to the dashboard! ✅

---

## 🔒 Security Features

### Password Hashing:
- ✅ Uses bcrypt with 10 rounds (secure and fast)
- ✅ Passwords never stored in plain text
- ✅ Each password has unique salt
- ✅ Rainbow table attacks prevented

### Authentication Flow:
1. User enters Employee ID + Password
2. System looks up user in database
3. Checks if user is active
4. Verifies role (admin/receptionist)
5. Compares password with bcrypt hash
6. Creates session if valid
7. Redirects to dashboard

### Error Messages:
- Generic "Invalid username or password" (doesn't reveal if user exists)
- Clear message if account is inactive
- Clear message if password not set

---

## 📝 How to Add New Staff User

### Option 1: Via Supabase Dashboard

1. Go to Table Editor → users table
2. Click "Insert row"
3. Fill in:
   - name: "Staff Name"
   - phone: "+233xxxxxxxxx"
   - role: "admin" or "receptionist"
   - employee_id: "UNIQUE_ID"
   - is_active: true
4. Save
5. Run password setup script to set their password

### Option 2: Via SQL

```sql
INSERT INTO users (name, phone, role, employee_id, is_active, password_hash)
VALUES (
  'New Staff',
  '+233200000004',
  'receptionist',
  'REC003',
  true,
  '<bcrypt-hashed-password>'
);
```

To generate a password hash:
```typescript
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('yourpassword', 10);
console.log(hash);
```

---

## 🔄 Change Password (Future Feature)

To implement password change:

1. Create `/api/auth/change-password` route
2. Verify old password
3. Hash new password
4. Update `password_hash` in database

Example:
```typescript
export async function POST(request: Request) {
  const { employeeId, oldPassword, newPassword } = await request.json();
  
  // 1. Get user
  const user = await getUserByEmployeeId(employeeId);
  
  // 2. Verify old password
  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) throw new Error("Invalid password");
  
  // 3. Hash new password
  const newHash = await bcrypt.hash(newPassword, 10);
  
  // 4. Update database
  await updateUserPassword(user.id, newHash);
  
  return { success: true };
}
```

---

## 🆘 Troubleshooting

### "Password not set"
- Run `npx tsx scripts/set-staff-passwords.ts`
- Check that `password_hash` column exists

### "Invalid username or password"
- Check Employee ID is correct
- Check password is correct
- Verify user exists in database
- Ensure user `is_active` is true

### "User account is inactive"
- User's `is_active` is false
- Update in Supabase: `UPDATE users SET is_active = true WHERE employee_id = 'XXX'`

### bcrypt error
- Ensure bcrypt is installed: `pnpm list bcrypt`
- Reinstall if needed: `pnpm add bcrypt`

---

## 📊 Password Requirements (Optional Enhancement)

Currently accepts any password. To add requirements:

```typescript
function validatePassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) && // uppercase
    /[a-z]/.test(password) && // lowercase
    /[0-9]/.test(password) && // number
    /[^A-Za-z0-9]/.test(password) // special char
  );
}
```

---

## 🎉 Summary

✅ **Secure** - Bcrypt hashing with salts  
✅ **Professional** - Industry standard authentication  
✅ **Simple** - Easy to use and maintain  
✅ **Scalable** - Ready for password reset features  
✅ **Production Ready** - Just change default passwords  

**Your staff login is now secure!** 🔒
