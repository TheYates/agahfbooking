import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import {
  useClientAppointments,
  useCancelAppointment,
} from "../../src/hooks/useAppointments";
import { AppointmentWithDetails } from "../../src/types";

export default function AppointmentsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const router = useRouter();

  const { data, refetch, isLoading } = useClientAppointments(user?.id || 0, {
    page,
    limit: 10,
  });

  const cancelMutation = useCancelAppointment();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCancel = (appointment: AppointmentWithDetails) => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment with ${appointment.department_name} on ${new Date(
        appointment.appointment_date
      ).toLocaleDateString()}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(appointment.id);
              Alert.alert("Success", "Appointment cancelled successfully");
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to cancel appointment"
              );
            }
          },
        },
      ]
    );
  };

  const renderAppointment = ({
    item,
  }: {
    item: AppointmentWithDetails;
  }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.departmentName}>{item.department_name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <Text style={styles.detailText}>
          📅 {new Date(item.appointment_date).toLocaleDateString()}
        </Text>
        <Text style={styles.detailText}>
          🕐 {item.slot_start_time?.slice(0, 5) || "TBD"} -{" "}
          {item.slot_end_time?.slice(0, 5) || "TBD"}
        </Text>
        {item.doctor_name && (
          <Text style={styles.detailText}>👨‍⚕️ Dr. {item.doctor_name}</Text>
        )}
      </View>

      {canCancel(item.status) && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancel(item)}
          disabled={cancelMutation.isPending}
        >
          <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      <FlatList
        data={data?.appointments || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAppointment}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No appointments found</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push("/(tabs)/book")}
            >
              <Text style={styles.bookButtonText}>Book an Appointment</Text>
            </TouchableOpacity>
          </View>
        }
      />
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

function canCancel(status: string): boolean {
  return ["pending_review", "booked"].includes(status);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
  },
  listContent: {
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  appointmentDetails: {
    gap: 4,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
