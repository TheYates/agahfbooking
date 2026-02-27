import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const [xNumber, setXNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { sendOTP } = useAuth();
  const router = useRouter();

  const validateXNumber = (value: string): boolean => {
    // Format: X12345/67 or X1234567
    const pattern = /^X\d{5,6}\/?\d{0,2}$/i;
    return pattern.test(value);
  };

  const handleSendOTP = async () => {
    setError("");

    if (!xNumber.trim()) {
      setError("Please enter your X-Number");
      return;
    }

    if (!validateXNumber(xNumber)) {
      setError("Invalid X-Number format. Example: X12345/67");
      return;
    }

    setIsLoading(true);

    try {
      await sendOTP(xNumber.toUpperCase());
      router.push({
        pathname: "/verify-otp",
        params: { xNumber: xNumber.toUpperCase() },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Enter your X-Number to receive an OTP
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>X-Number</Text>
              <TextInput
                style={styles.input}
                placeholder="X12345/67"
                value={xNumber}
                onChangeText={setXNumber}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Text style={styles.hint}>
                Format: X followed by your number (e.g., X12345/67)
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  error: {
    color: "#ef4444",
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
