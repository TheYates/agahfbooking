import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { format, addDays } from "date-fns";
import { useDepartments, useAvailableSlots, useBookAppointment } from "../../src/hooks/useAppointments";
import { useAuth } from "../../src/context/AuthContext";
import { Department } from "../../src/types";

export default function BookAppointmentScreen() {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();
  
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: availableSlots, isLoading: loadingSlots } = useAvailableSlots(
    selectedDepartment?.id || 0,
    selectedDate || ""
  );
  
  const bookMutation = useBookAppointment();

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date: format(date, "yyyy-MM-dd"),
      display: format(date, "EEE, MMM d"),
    };
  });

  const handleBook = async () => {
    if (!selectedDepartment || !selectedDate || !selectedSlot || !user) {
      Alert.alert("Error", "Please select all fields");
      return;
    }

    try {
      await bookMutation.mutateAsync({
        client_id: user.id,
        department_id: selectedDepartment.id,
        appointment_date: selectedDate,
        slot_number: selectedSlot,
        booked_by: user.id,
      });

      Alert.alert(
        "Success",
        "Your appointment has been booked successfully!",
        [
          {
            text: "View Appointments",
            onPress: () => router.push("/(tabs)/appointments"),
          },
          {
            text: "OK",
            onPress: () => router.push("/(tabs)"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to book appointment"
      );
    }
  };

  if (loadingDepartments) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book Appointment</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Department Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Department</Text>
          <View style={styles.cardsContainer}>
            {departments?.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={[
                  styles.departmentCard,
                  selectedDepartment?.id === dept.id && styles.selectedCard,
                ]}
                onPress={() => {
                  setSelectedDepartment(dept);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
              >
                <Text style={styles.departmentName}>{dept.name}</Text>
                <Text style={styles.departmentDescription}>
                  {dept.description || "No description"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        {selectedDepartment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.datesContainer}>
                {dates.map((item) => (
                  <TouchableOpacity
                    key={item.date}
                    style={[
                      styles.dateCard,
                      selectedDate === item.date && styles.selectedCard,
                    ]}
                    onPress={() => {
                      setSelectedDate(item.date);
                      setSelectedSlot(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        selectedDate === item.date && styles.selectedText,
                      ]}
                    >
                      {item.display}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Slot Selection */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time Slot</Text>
            {loadingSlots ? (
              <ActivityIndicator color="#007AFF" />
            ) : availableSlots && availableSlots.length > 0 ? (
              <View style={styles.slotsContainer}>
                {availableSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.slotCard,
                      selectedSlot === slot && styles.selectedCard,
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selectedSlot === slot && styles.selectedText,
                      ]}
                    >
                      Slot {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noSlots}>No available slots for this date</Text>
            )}
          </View>
        )}

        {/* Book Button */}
        {selectedSlot && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.bookButton,
                bookMutation.isPending && styles.bookButtonDisabled,
              ]}
              onPress={handleBook}
              disabled={bookMutation.isPending}
            >
              {bookMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  cardsContainer: {
    gap: 8,
  },
  departmentCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f7ff",
  },
  departmentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  departmentDescription: {
    fontSize: 14,
    color: "#666",
  },
  datesContainer: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  dateCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  selectedText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  slotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  slotText: {
    fontSize: 14,
    color: "#333",
  },
  noSlots: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    padding: 20,
  },
  bookButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
