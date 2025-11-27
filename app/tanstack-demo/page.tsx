'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QuickBookingDialogTanstack } from '@/components/ui/quick-booking-dialog-tanstack'

export default function TanStackDemo() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="container mx-auto py-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">TanStack Query Demo</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the power of TanStack Query in your hospital booking system. 
          This version eliminates complex useEffect patterns and provides intelligent caching, 
          real-time updates, and optimistic mutations.
        </p>
        
        <div className="bg-card border rounded-lg p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">✨ TanStack Query Benefits</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <h3 className="font-medium text-green-600">🚀 Performance Gains</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Intelligent caching reduces API calls</li>
                <li>• Background updates keep data fresh</li>
                <li>• Optimistic updates for instant feedback</li>
                <li>• Automatic retries with exponential backoff</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">💻 Developer Experience</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 90% less data fetching boilerplate</li>
                <li>• Built-in loading and error states</li>
                <li>• Powerful DevTools for debugging</li>
                <li>• Type-safe query keys</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-purple-600">🏥 Hospital-Specific</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Real-time appointment availability</li>
                <li>• Smart caching for department data</li>
                <li>• Instant booking confirmations</li>
                <li>• Offline-first patient data</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-orange-600">👥 User Experience</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• No loading flickers with cached data</li>
                <li>• Instant search results</li>
                <li>• Seamless error recovery</li>
                <li>• Background sync for availability</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Try it yourself!</h3>
          <p className="text-muted-foreground">
            Open the booking dialog and notice how much smoother the experience is with TanStack Query
          </p>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Open TanStack Booking Dialog
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
          <h4 className="font-medium mb-2">🔧 Implementation Highlights</h4>
          <div className="text-sm text-left space-y-1 text-muted-foreground">
            <p>• <code className="text-xs bg-muted px-1 rounded">useDepartments()</code> - Cached for 1 hour, departments rarely change</p>
            <p>• <code className="text-xs bg-muted px-1 rounded">useSchedule()</code> - Auto-refresh every minute for real-time availability</p>
            <p>• <code className="text-xs bg-muted px-1 rounded">useBookAppointment()</code> - Optimistic updates with automatic rollback</p>
            <p>• <code className="text-xs bg-muted px-1 rounded">useClients()</code> - Smart search with debouncing and caching</p>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              💡 <strong>Dev Mode:</strong> Open DevTools and check the TanStack Query tab 
              (bottom-left) to see real-time query status, cache contents, and performance metrics!
            </p>
          </div>
        )}
      </div>

      <QuickBookingDialogTanstack
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        userRole="receptionist"
      />
    </div>
  )
}