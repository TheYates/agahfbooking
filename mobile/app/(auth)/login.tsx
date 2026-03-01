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
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const [xNumber, setXNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState("");
  const { sendOTP } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Check for timeout message
  const timeoutMessage = params.reason === "timeout" 
    ? "You were logged out due to inactivity. Please log in again to continue."
    : "";

  const validateXNumber = (value: string): boolean => {
    // Format: X12345/67
    const digitsOnly = value.replace(/[^0-9]/g, "");
    return digitsOnly.length === 7 && value.match(/^X\d{5}\/\d{2}$/i) !== null;
  };

  const handleXNumberChange = (value: string) => {
    // Remove non-numeric characters
    let digits = value.replace(/[^0-9]/g, "");

    // Limit to 7 digits
    if (digits.length > 7) {
      digits = digits.slice(0, 7);
    }

    // Format as X#####/##
    let formatted = "X";
    if (digits.length > 0) {
      formatted += digits.slice(0, 5);
      if (digits.length > 5) {
        formatted += "/" + digits.slice(5);
      }
    }

    setXNumber(formatted);

    // Clear error on input
    if (error) {
      setError("");
    }
  };

  const handleSendOTP = async () => {
    setError("");

    if (!xNumber.trim() || xNumber === "X") {
      setError("Please enter your X-Number");
      return;
    }

    if (!validateXNumber(xNumber)) {
      setError("Please enter a complete X-number (7 digits required)");
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendOTP(xNumber.toUpperCase());
      
      // Check if we got a mock OTP (development mode)
      if (result.mockOtp) {
        setMockOtp(result.mockOtp);
      }
      
      router.push({
        pathname: "/verify-otp",
        params: { 
          xNumber: xNumber.toUpperCase(),
          mockOtp: result.mockOtp || "",
        },
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
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/agahflogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Enter your X-Number to access your portal
            </Text>

            {timeoutMessage ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>⏱️ {timeoutMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>X-Number</Text>
              <TextInput
                style={styles.input}
                placeholder="X12345/67"
                value={xNumber}
                onChangeText={handleXNumberChange}
                keyboardType="numeric"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
                maxLength={10}
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
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            {/* Staff Login Link */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push("/staff-login" as any)}
              disabled={isLoading}
            >
              <Text style={styles.linkButtonText}>I am a Staff Member</Text>
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Protected by secure OTP verification.{"\n"}
                <Text
                  style={styles.footerLink}
                  onPress={() => Linking.openURL("https://agahf.com/privacy")}
                >
                  Privacy Policy
                </Text>
                {" • "}
                <Text
                  style={styles.footerLink}
                  onPress={() => Linking.openURL("https://agahf.com/help")}
                >
                  Help Center
                </Text>
              </Text>
            </View>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
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
    marginBottom: 24,
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: "#92400E",
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 18,
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
    backgroundColor: "#fee",
    padding: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e5e5",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
  },
  linkButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  linkButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: "#16a34a",
    textDecorationLine: "underline",
  },
});
