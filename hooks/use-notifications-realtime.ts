'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  event_type: string
  related_appointment_id: number | null
  action_url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

interface UseNotificationsRealtimeOptions {
  userId?: number
  enabled?: boolean
  onNewNotification?: (notification: Notification) => void
}

export function useNotificationsRealtime({
  userId,
  enabled = true,
  onNewNotification,
}: UseNotificationsRealtimeOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId || !enabled) return

    try {
      const response = await fetch('/api/notifications?limit=20')
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.notifications?.filter((n: Notification) => !n.is_read).length || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, enabled])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId || !enabled) return

    try {
      const response = await fetch('/api/notifications/unread-count')
      const data = await response.json()
      setUnreadCount(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [userId, enabled])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [])

  // Set up realtime subscription
  useEffect(() => {
    if (!userId || !enabled) return

    fetchNotifications()

    const supabase = createBrowserSupabaseClient()

    const channel = supabase
      .channel(`notifications:user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification

          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)

          if (onNewNotification) {
            onNewNotification(newNotification)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification

          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          )

          // Recalculate unread count
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, enabled, fetchNotifications, fetchUnreadCount, onNewNotification])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}
