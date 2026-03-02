# Supabase Realtime Hook Documentation

## Overview

The `useSupabaseRealtime` hook provides a reusable, type-safe way to add real-time database subscriptions to any React Query hook in your application. It automatically invalidates React Query cache when database changes occur, providing instant updates across your UI.

## Features

✅ **One-line integration** - Add realtime to any table with minimal code  
✅ **Automatic cache invalidation** - React Query refetches automatically  
✅ **Flexible filtering** - Subscribe to specific rows or all changes  
✅ **Toast notifications** - Optional user feedback for changes  
✅ **Debug mode** - Built-in logging for troubleshooting  
✅ **Error handling** - Graceful fallback when realtime fails  
✅ **TypeScript support** - Full type safety and autocomplete  
✅ **Memory efficient** - Proper cleanup on unmount  

---

## Basic Usage

### Import the Hook

```typescript
import { useSupabaseRealtime } from '@/hooks/use-supabase-realtime'
```

### Simple Example

```typescript
// Listen to all appointments
useSupabaseRealtime({
  table: 'appointments',
  queryKey: ['appointments'],
})
```

### With Filter

```typescript
// Listen to appointments for a specific client
useSupabaseRealtime({
  table: 'appointments',
  filter: 'client_id=eq.123',
  queryKey: ['appointments', 'client', 123],
})
```

### With Toast Notifications

```typescript
useSupabaseRealtime({
  table: 'appointments',
  queryKey: ['appointments'],
  showToasts: true,
  toastMessages: {
    insert: 'New appointment booked!',
    update: 'Appointment updated!',
    delete: 'Appointment cancelled!',
  },
})
```

---

## API Reference

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `table` | `string` | **Required** | Database table to listen to |
| `queryKey` | `any[]` | **Required** | React Query key to invalidate |
| `filter` | `string` | `undefined` | Supabase filter (e.g., `'client_id=eq.123'`) |
| `event` | `'*' \| 'INSERT' \| 'UPDATE' \| 'DELETE'` | `'*'` | Which events to listen for |
| `enabled` | `boolean` | `true` | Enable/disable subscription |
| `onUpdate` | `(payload: any) => void` | `undefined` | Callback when event occurs |
| `showToasts` | `boolean` | `false` | Show toast notifications |
| `toastMessages` | `object` | See below | Custom toast messages |
| `debug` | `boolean` | `false` | Enable debug logging |
| `channelName` | `string` | Auto-generated | Custom channel name |

### Toast Messages

```typescript
toastMessages?: {
  insert?: string  // Message for INSERT events
  update?: string  // Message for UPDATE events
  delete?: string  // Message for DELETE events
}
```

---

## Real-World Examples

### Example 1: Client Appointments (Filtered)

```typescript
import { useQuery } from '@tanstack/react-query'
import { useSupabaseRealtime } from '@/hooks/use-supabase-realtime'

export const useClientAppointments = (clientId: number) => {
  // Regular React Query hook
  const query = useQuery({
    queryKey: ['appointments', 'client', clientId],
    queryFn: () => fetchClientAppointments(clientId),
    staleTime: 30 * 1000,
  })

  // Add realtime with one line!
  useSupabaseRealtime({
    table: 'appointments',
    filter: `client_id=eq.${clientId}`,
    queryKey: ['appointments', 'client', clientId],
    enabled: !!clientId,
    showToasts: true,
    toastMessages: {
      insert: 'New appointment booked!',
      update: 'Appointment updated!',
      delete: 'Appointment cancelled!',
    },
  })

  return query
}
```

### Example 2: All Departments (No Filter)

```typescript
export const useDepartments = () => {
  const query = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    staleTime: 60 * 1000,
  })

  // Listen to all department changes
  useSupabaseRealtime({
    table: 'departments',
    queryKey: ['departments'],
    debug: true, // Enable logging
  })

  return query
}
```

### Example 3: Calendar with Date Range

```typescript
export const useCalendarAppointments = (startDate: string, endDate: string) => {
  const query = useQuery({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => fetchCalendarAppointments(startDate, endDate),
  })

  // No filter - listen to all appointments
  // React Query will refetch and apply date filtering
  useSupabaseRealtime({
    table: 'appointments',
    queryKey: ['calendar', startDate, endDate],
  })

  return query
}
```

### Example 4: With Custom Logic

```typescript
export const useAppointmentsWithNotifications = (clientId: number) => {
  const query = useQuery({
    queryKey: ['appointments', clientId],
    queryFn: () => fetchAppointments(clientId),
  })

  useSupabaseRealtime({
    table: 'appointments',
    filter: `client_id=eq.${clientId}`,
    queryKey: ['appointments', clientId],
    onUpdate: (payload) => {
      // Custom logic
      if (payload.eventType === 'INSERT') {
        playNotificationSound()
        sendPushNotification({
          title: 'New Appointment',
          body: 'You have a new appointment!',
        })
      }
      
      // Log to analytics
      analytics.track('appointment_updated', {
        event: payload.eventType,
        clientId,
      })
    },
  })

  return query
}
```

### Example 5: Listen to Specific Events Only

```typescript
// Only listen to INSERT events
useSupabaseRealtime({
  table: 'appointments',
  event: 'INSERT',
  queryKey: ['appointments', 'new'],
  showToasts: true,
  toastMessages: {
    insert: '🎉 New appointment!',
  },
})

// Only listen to DELETE events
useSupabaseRealtime({
  table: 'appointments',
  event: 'DELETE',
  queryKey: ['appointments', 'cancelled'],
  showToasts: true,
  toastMessages: {
    delete: 'Appointment cancelled',
  },
})
```

---

## Specialized Hooks

For common use cases, there are specialized hooks with sensible defaults:

### `useAppointmentsRealtime`

```typescript
import { useAppointmentsRealtime } from '@/hooks/use-supabase-realtime'

// Simplified hook for appointments
useAppointmentsRealtime({
  clientId: 123,
  queryKey: ['appointments', 'client', 123],
  showToasts: true, // Enabled by default
})
```

### `useDepartmentsRealtime`

```typescript
import { useDepartmentsRealtime } from '@/hooks/use-supabase-realtime'

// Simplified hook for departments
useDepartmentsRealtime({
  queryKey: ['departments'],
})
```

### `useUsersRealtime`

```typescript
import { useUsersRealtime } from '@/hooks/use-supabase-realtime'

// Simplified hook for users
useUsersRealtime({
  queryKey: ['users', 'list'],
})
```

---

## Filtering Guide

Supabase realtime filters use PostgreSQL operators:

| Filter | Example | Description |
|--------|---------|-------------|
| Equals | `client_id=eq.123` | Exact match |
| Not equals | `status=neq.cancelled` | Not equal to |
| Greater than | `date=gt.2024-01-01` | Greater than |
| Less than | `date=lt.2024-12-31` | Less than |
| Greater/equal | `priority=gte.5` | Greater than or equal |
| Less/equal | `priority=lte.10` | Less than or equal |
| In list | `status=in.(scheduled,completed)` | In array |
| Like | `name=like.*John*` | Pattern matching |

### Multiple Filters

You can't use multiple filters directly. Instead, listen to all events and filter in React Query:

```typescript
// ❌ Not supported
filter: 'client_id=eq.123&status=eq.scheduled'

// ✅ Use this instead
useSupabaseRealtime({
  table: 'appointments',
  filter: 'client_id=eq.123',
  queryKey: ['appointments', 'client', 123],
})

// Then filter in your query
const query = useQuery({
  queryKey: ['appointments', 'client', 123],
  queryFn: async () => {
    const data = await fetchAppointments(123)
    return data.filter(apt => apt.status === 'scheduled')
  },
})
```

---

## Performance Tips

### 1. Use Specific Filters

```typescript
// ✅ Good - Only listens to relevant changes
useSupabaseRealtime({
  table: 'appointments',
  filter: 'client_id=eq.123',
  queryKey: ['appointments', 'client', 123],
})

// ❌ Bad - Listens to ALL appointments (unnecessary refetches)
useSupabaseRealtime({
  table: 'appointments',
  queryKey: ['appointments', 'client', 123],
})
```

### 2. Disable When Not Needed

```typescript
useSupabaseRealtime({
  table: 'appointments',
  queryKey: ['appointments'],
  enabled: isUserOnline && isPageVisible, // Conditional
})
```

### 3. Use Debug Mode During Development

```typescript
useSupabaseRealtime({
  table: 'appointments',
  queryKey: ['appointments'],
  debug: process.env.NODE_ENV === 'development',
})
```

### 4. Avoid Unnecessary Subscriptions

```typescript
// ❌ Bad - Creates subscription even when disabled
const query = useQuery({
  enabled: false,
  ...
})
useSupabaseRealtime({ enabled: true, ... }) // Still subscribes!

// ✅ Good - Sync enabled state
const enabled = someCondition
useQuery({ enabled, ... })
useSupabaseRealtime({ enabled, ... })
```

---

## Troubleshooting

### No Events Received

**Check 1: Replication Enabled?**
```sql
-- Run in Supabase SQL Editor
SELECT schemaname, tablename 
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

If your table is missing, enable replication:
1. Go to Supabase Dashboard → Database → Replication
2. Find your table and toggle ON
3. Save changes

**Check 2: RLS Policies**
Ensure your Row Level Security policies allow reading:
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'appointments';
```

**Check 3: Connection Status**
Enable debug mode to see connection status:
```typescript
useSupabaseRealtime({
  debug: true, // Check console logs
  ...
})
```

### Multiple Refetches

If you see multiple refetches for the same event, you likely have multiple subscriptions:

```typescript
// ❌ Creates 2 subscriptions to the same table
useSupabaseRealtime({ table: 'appointments', ... })
useSupabaseRealtime({ table: 'appointments', ... })

// ✅ Use one subscription per table
useSupabaseRealtime({ table: 'appointments', ... })
```

### Events Not Invalidating Cache

Check that your `queryKey` matches exactly:

```typescript
// ❌ Keys don't match
const query = useQuery({ queryKey: ['appointments', 'list', 123] })
useSupabaseRealtime({ queryKey: ['appointments', 123] }) // Different!

// ✅ Keys match
const queryKey = ['appointments', 'list', 123]
const query = useQuery({ queryKey })
useSupabaseRealtime({ queryKey })
```

---

## Migration Guide

### Before (Manual Realtime)

```typescript
export const useAppointments = (clientId: number) => {
  const queryClient = useQueryClient()
  const supabase = createBrowserSupabaseClient()

  const query = useQuery({
    queryKey: ['appointments', clientId],
    queryFn: () => fetchAppointments(clientId),
  })

  useEffect(() => {
    if (!clientId) return

    const channel = supabase
      .channel('appointments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        queryClient.invalidateQueries({ 
          queryKey: ['appointments', clientId] 
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, queryClient, supabase])

  return query
}
```

### After (Reusable Hook)

```typescript
export const useAppointments = (clientId: number) => {
  const query = useQuery({
    queryKey: ['appointments', clientId],
    queryFn: () => fetchAppointments(clientId),
  })

  useSupabaseRealtime({
    table: 'appointments',
    filter: `client_id=eq.${clientId}`,
    queryKey: ['appointments', clientId],
    enabled: !!clientId,
  })

  return query
}
```

**Result: 80% less code, same functionality!**

---

## Best Practices

### ✅ Do's

1. **Use specific filters** when possible
   ```typescript
   filter: 'client_id=eq.123' // Only relevant changes
   ```

2. **Match query keys exactly**
   ```typescript
   const key = ['appointments', id]
   useQuery({ queryKey: key })
   useSupabaseRealtime({ queryKey: key })
   ```

3. **Enable debug mode during development**
   ```typescript
   debug: process.env.NODE_ENV === 'development'
   ```

4. **Use toast notifications for user actions**
   ```typescript
   showToasts: true // User feedback
   ```

5. **Disable when not needed**
   ```typescript
   enabled: isOnline && isVisible
   ```

### ❌ Don'ts

1. **Don't create multiple subscriptions to the same table**
   ```typescript
   // ❌ Bad
   useSupabaseRealtime({ table: 'appointments', ... })
   useSupabaseRealtime({ table: 'appointments', ... })
   ```

2. **Don't forget to sync enabled state**
   ```typescript
   // ❌ Bad
   useQuery({ enabled: false })
   useSupabaseRealtime({ enabled: true })
   ```

3. **Don't use complex filters**
   ```typescript
   // ❌ Not supported
   filter: 'client_id=eq.123&status=eq.scheduled'
   ```

4. **Don't leave debug mode on in production**
   ```typescript
   // ❌ Bad
   debug: true // In production
   ```

---

## Examples in This Codebase

Look at these files for real-world usage:

- `hooks/use-hospital-queries.ts` - Line 678 (Dashboard Stats)
- `hooks/use-hospital-queries.ts` - Line 738 (Client Appointments)
- `hooks/use-hospital-queries.ts` - Line 802 (Calendar)
- `hooks/use-hospital-queries.ts` - Line 1295 (Appointments List)

---

## Support

For issues or questions:
1. Check console logs with `debug: true`
2. Verify Supabase replication is enabled
3. Check RLS policies allow reading
4. Review the troubleshooting section above

---

## Changelog

### v1.0.0 (Current)
- ✅ Initial release
- ✅ Support for filters, events, toasts
- ✅ Debug mode
- ✅ Specialized hooks for common tables
- ✅ TypeScript support
