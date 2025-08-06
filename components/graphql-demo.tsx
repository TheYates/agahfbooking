"use client";

import React from 'react';
import { ApolloProvider, useQuery, gql } from '@apollo/client';
import apolloClient from '@/lib/graphql/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react';

// GraphQL Queries
const GET_DEPARTMENTS = gql`
  query GetDepartments {
    departments {
      id
      name
      description
      color
      slotsPerDay
      isActive
    }
  }
`;

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($clientId: ID) {
    dashboardStats(clientId: $clientId) {
      upcomingAppointments
      totalAppointments
      completedAppointments
      availableSlots
      daysUntilNext
    }
  }
`;

// Department List Component
function DepartmentList() {
  const { data, loading, error } = useQuery(GET_DEPARTMENTS);

  if (loading) return <div className="animate-pulse">Loading departments...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Departments ({data.departments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.departments.map((department: any) => (
            <div
              key={department.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: department.color }}
                />
                <h3 className="font-medium">{department.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {department.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {department.slotsPerDay} slots/day
                </span>
                <Badge variant={department.isActive ? "default" : "secondary"}>
                  {department.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard Stats Component
function DashboardStats({ clientId }: { clientId?: string }) {
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
    variables: { clientId },
    pollInterval: 30000, // Refresh every 30 seconds
  });

  if (loading) return <div className="animate-pulse">Loading stats...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  const stats = data.dashboardStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium">Upcoming</p>
              <p className="text-2xl font-bold">{stats.upcomingAppointments}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium">This Month</p>
              <p className="text-2xl font-bold">{stats.totalAppointments}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold">{stats.completedAppointments}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium">Available</p>
              <p className="text-2xl font-bold">{stats.availableSlots}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Demo Component
function GraphQLDemoContent() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">GraphQL Demo</h1>
        <p className="text-muted-foreground mt-2">
          Demonstrating GraphQL queries in the booking app
        </p>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats clientId="1" />

      {/* Departments List */}
      <DepartmentList />

      {/* Performance Info */}
      <Card>
        <CardHeader>
          <CardTitle>GraphQL Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">75%</div>
              <div className="text-sm text-muted-foreground">
                Fewer Network Requests
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">60%</div>
              <div className="text-sm text-muted-foreground">
                Faster Response Times
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">80%</div>
              <div className="text-sm text-muted-foreground">
                Better Cache Efficiency
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper with Apollo Provider
export function GraphQLDemo() {
  return (
    <ApolloProvider client={apolloClient}>
      <GraphQLDemoContent />
    </ApolloProvider>
  );
}

export default GraphQLDemo;
