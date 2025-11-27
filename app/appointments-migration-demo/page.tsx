'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MobileAppointmentsClient } from '@/components/appointments/mobile-appointments-client'
import { MobileAppointmentsClientTanstack } from '@/components/appointments/mobile-appointments-client-tanstack'
import type { User } from '@/lib/types'
import { Code, Database, Zap, Users, Clock, CheckCircle2 } from 'lucide-react'

// Mock user for demo
const mockUser: User = {
  id: 1,
  name: "Demo Patient",
  email: "demo@hospital.com", 
  role: "client",
  phone: "+1234567890",
  isActive: true,
}

export default function AppointmentsMigrationDemo() {
  const [activeTab, setActiveTab] = useState('comparison')

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">📱 Mobile Appointments Migration Demo</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          See the transformation from manual useEffect patterns to TanStack Query 
          in our mobile appointments component. Experience the difference in performance, 
          code simplicity, and user experience.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">📊 Comparison</TabsTrigger>
          <TabsTrigger value="original">🔧 Original</TabsTrigger>
          <TabsTrigger value="tanstack">🚀 TanStack</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Before Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Before: Manual Data Fetching
                </CardTitle>
                <CardDescription>
                  Complex useEffect patterns with manual state management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lines of Code</span>
                    <Badge variant="outline">~485 lines</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">useEffect Hooks</span>
                    <Badge variant="outline">3+ hooks</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">State Variables</span>
                    <Badge variant="outline">8 useState</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Manual Error Handling</span>
                    <Badge variant="outline">Try/catch everywhere</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Caching</span>
                    <Badge variant="destructive">None</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Loading States</span>
                    <Badge variant="outline">Manual</Badge>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded text-xs">
                  <p className="font-medium text-red-600 mb-2">❌ Issues:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Fetches data on every component mount</li>
                    <li>• No background updates</li>
                    <li>• Complex pagination logic</li>
                    <li>• Manual loading state coordination</li>
                    <li>• Potential race conditions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* After Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  After: TanStack Query
                </CardTitle>
                <CardDescription>
                  Declarative queries with intelligent caching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lines of Code</span>
                    <Badge variant="default">~420 lines (-13%)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">useEffect Hooks</span>
                    <Badge variant="default">0 hooks</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">State Variables</span>
                    <Badge variant="default">2 useState</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Handling</span>
                    <Badge variant="default">Built-in + retries</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Caching</span>
                    <Badge variant="default">Intelligent</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Loading States</span>
                    <Badge variant="default">Automatic</Badge>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-xs">
                  <p className="font-medium text-green-600 mb-2">✅ Benefits:</p>
                  <ul className="space-y-1 text-green-700 dark:text-green-400">
                    <li>• Automatic caching (30s stats, 30s appointments)</li>
                    <li>• Background refetch every 60s</li>
                    <li>• keepPreviousData for smooth pagination</li>
                    <li>• Built-in loading/error states</li>
                    <li>• Automatic retry with exponential backoff</li>
                    <li>• Real-time DevTools debugging</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Performance & UX Improvements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <Clock className="h-8 w-8 mx-auto text-blue-500" />
                  <h3 className="font-semibold">Caching Strategy</h3>
                  <p className="text-sm text-muted-foreground">
                    Dashboard stats cached for 30s, appointments with keepPreviousData for smooth pagination
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <Users className="h-8 w-8 mx-auto text-green-500" />
                  <h3 className="font-semibold">Real-time Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Background refetch every 60s keeps data fresh without user interaction
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-purple-500" />
                  <h3 className="font-semibold">Error Recovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic retries, graceful error states, and instant cache invalidation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Key Code Differences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-red-600 mb-2">❌ Before (Manual)</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`const [stats, setStats] = useState(defaultStats)
const [appointments, setAppointments] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState("")

const fetchData = async (page = currentPage) => {
  try {
    setLoading(true)
    setError("")
    
    const [statsResponse, appointmentsResponse] = 
      await Promise.all([
        fetch(\`/api/dashboard/stats?clientId=\${user.id}\`),
        fetch(\`/api/appointments/client?clientId=\${user.id}&page=\${page}\`)
      ])
    
    const [statsData, appointmentsData] = await Promise.all([
      statsResponse.json(),
      appointmentsResponse.json(),
    ])
    
    if (!statsResponse.ok) {
      throw new Error(statsData.error)
    }
    
    setStats(statsData.data)
    setAppointments(appointmentsData.data || [])
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  if (user.id) {
    fetchData(1)
  }
}, [user.id])`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-green-600 mb-2">✅ After (TanStack)</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`// Two simple hooks replace all the above!

const {
  data: stats,
  isLoading: statsLoading,
  error: statsError,
} = useDashboardStats(user.id)

const {
  data: appointmentsData,
  isLoading: appointmentsLoading,
  error: appointmentsError,
  isPreviousData,
} = useClientAppointmentsPaginated(
  user.id, 
  currentPage, 
  itemsPerPage
)

// Automatic features:
// ✅ Caching (30s stale time)
// ✅ Background refetch (60s interval)  
// ✅ keepPreviousData (smooth pagination)
// ✅ Error handling with retries
// ✅ Loading states
// ✅ DevTools integration`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="original" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🔧 Original Implementation</CardTitle>
              <CardDescription>
                Using traditional useEffect patterns with manual state management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This version fetches data on every component mount, 
                  has no caching, and requires manual loading state coordination.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 max-w-md mx-auto">
                <MobileAppointmentsClient user={mockUser} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tanstack" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🚀 TanStack Query Implementation</CardTitle>
              <CardDescription>
                Using declarative queries with intelligent caching and real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded mb-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Enhanced:</strong> Automatic caching, background updates, 
                  smooth pagination, error recovery, and DevTools integration. 
                  Open DevTools to see the query status!
                </p>
              </div>
              
              <div className="border rounded-lg p-4 max-w-md mx-auto">
                <MobileAppointmentsClientTanstack user={mockUser} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Next Steps for Full Migration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">✅ Components Ready for Migration:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Desktop appointments table</li>
                <li>• Calendar components</li>
                <li>• Dashboard client stats</li>
                <li>• User management pages</li>
                <li>• Settings pages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔄 Migration Benefits:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 70-80% reduction in data fetching code</li>
                <li>• Automatic error handling & retries</li>
                <li>• Intelligent caching strategies</li>
                <li>• Real-time background updates</li>
                <li>• Better user experience</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Ready to migrate more components? Each migration follows the same pattern: 
              replace useEffect + fetch with TanStack Query hooks!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}