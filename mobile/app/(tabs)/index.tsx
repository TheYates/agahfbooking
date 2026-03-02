import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Surface,
  Avatar,
  Chip,
  Divider,
  IconButton,
} from "react-native-paper";
import { useAuth } from "../../src/context/AuthContext";
import { useDashboardStats, useClientAppointments } from "../../src/hooks/useAppointments";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const { data: stats, refetch: refetchStats } = useDashboardStats();
  const { data: appointmentsData, refetch: refetchAppointments } =
    useClientAppointments(user?.id || 0, { limit: 3 });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchAppointments()]);
    setRefreshing(false);
  };

  const appointments = appointmentsData?.appointments || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header} elevation={1}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text variant="bodyMedium" style={styles.greeting}>
                Welcome back,
              </Text>
              <Title style={styles.name}>{user?.name || "Patient"}</Title>
              <Chip icon="card-account-details" compact style={styles.xNumberChip}>
                {user?.xNumber}
              </Chip>
            </View>
            <Avatar.Icon size={56} icon="account-circle" style={styles.avatar} />
          </View>
        </Surface>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="calendar-clock"
                style={styles.statIcon}
              />
              <Title style={styles.statNumber}>
                {stats?.upcomingAppointments || 0}
              </Title>
              <Paragraph style={styles.statLabel}>Upcoming</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="calendar-check"
                style={styles.statIcon}
              />
              <Title style={styles.statNumber}>
                {stats?.totalAppointments || 0}
              </Title>
              <Paragraph style={styles.statLabel}>Total</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <Card style={styles.actionCard}>
            <Card.Content style={styles.actionCardContent}>
              <Button
                mode="contained"
                icon="calendar-plus"
                onPress={() => router.push("/(tabs)/book")}
                style={styles.actionButton}
              >
                Book New Appointment
              </Button>
              <Button
                mode="outlined"
                icon="calendar-month"
                onPress={() => router.push("/(tabs)/appointments")}
                style={styles.actionButton}
              >
                View My Appointments
              </Button>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Appointments
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => router.push("/(tabs)/appointments")}
            >
              See All
            </Button>
          </View>

          {appointments.length === 0 ? (
            <Card style={styles.emptyState}>
              <Card.Content style={styles.emptyContent}>
                <Avatar.Icon
                  size={64}
                  icon="calendar-blank"
                  style={styles.emptyIcon}
                />
                <Title>No appointments yet</Title>
                <Paragraph>Book your first appointment now!</Paragraph>
              </Card.Content>
            </Card>
          ) : (
            appointments.map((apt) => (
              <Card key={apt.id} style={styles.appointmentCard}>
                <Card.Content>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentInfo}>
                      <Avatar.Icon
                        size={40}
                        icon="hospital-building"
                        style={styles.deptIcon}
                      />
                      <View style={styles.appointmentText}>
                        <Title style={styles.departmentName}>
                          {apt.department_name}
                        </Title>
                        <Paragraph style={styles.appointmentDate}>
                          {new Date(apt.appointment_date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          • {apt.slot_start_time?.slice(0, 5) || "TBD"}
                        </Paragraph>
                      </View>
                    </View>
                    <Chip
                      mode="outlined"
                      style={{ backgroundColor: getStatusColor(apt.status) }}
                      textStyle={{ color: "#fff", fontSize: 11 }}
                    >
                      {formatStatus(apt.status)}
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_review: "#fbbf24",
    booked: "#3b82f6",
    arrived: "#10b981",
    waiting: "#f97316",
    completed: "#6b7280",
    no_show: "#ef4444",
    cancelled: "#ef4444",
    rescheduled: "#8b5cf6",
  };
  return colors[status] || "#6b7280";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    color: "#666",
    marginBottom: 4,
  },
  name: {
    marginTop: 0,
    marginBottom: 8,
  },
  xNumberChip: {
    alignSelf: "flex-start",
  },
  avatar: {
    backgroundColor: "#16a34a",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statIcon: {
    backgroundColor: "#16a34a",
    alignSelf: "center",
  },
  statNumber: {
    textAlign: "center",
    color: "#16a34a",
    marginTop: 8,
  },
  statLabel: {
    textAlign: "center",
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
  },
  actionCard: {
    marginBottom: 8,
  },
  actionCardContent: {
    gap: 12,
  },
  actionButton: {
    marginVertical: 4,
  },
  emptyState: {
    marginBottom: 8,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyIcon: {
    backgroundColor: "#e5e5e5",
    marginBottom: 16,
  },
  appointmentCard: {
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appointmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  deptIcon: {
    backgroundColor: "#0284c7",
    marginRight: 12,
  },
  appointmentText: {
    flex: 1,
  },
  departmentName: {
    fontSize: 16,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 13,
  },
});
