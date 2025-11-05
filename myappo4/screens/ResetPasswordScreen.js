// screens/ResetPasswordScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import { BASE_URL } from "../config";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params; // รับ email จากหน้า ForgotPassword
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      showModal("กรุณากรอกข้อมูลให้ครบ", false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        showModal(data.message || "รีเซ็ตรหัสผ่านสำเร็จ!", true);
      } else {
        showModal(data.error || "ไม่สามารถรีเซ็ตรหัสผ่านได้", false);
      }
    } catch (err) {
      console.error(err);
      showModal("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", false);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (msg, success) => {
    setMessage(msg);
    setIsSuccess(success);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      if (isSuccess) navigation.navigate("Login");
    });
  };

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ตั้งรหัสผ่านใหม่</Text>

      <TextInput
        placeholder="OTP"
        value={otp}
        onChangeText={setOtp}
        style={styles.input}
        keyboardType="number-pad"
        placeholderTextColor="#aaa"
      />

      <TextInput
        placeholder="รหัสผ่านใหม่"
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor="#aaa"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>รีเซ็ตรหัสผ่าน</Text>
        )}
      </TouchableOpacity>

      {/* Modal แจ้งผล */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBox, { opacity: fadeAnim }]}>
            <Ionicons
              name={isSuccess ? "checkmark-circle" : "alert-circle"}
              size={60}
              color={isSuccess ? "#4CAF50" : "#e50914"}
              style={{ marginBottom: 10 }}
            />
            <Text
              style={[
                styles.modalTitle,
                { color: isSuccess ? "#4CAF50" : "#e50914" },
              ]}
            >
              {isSuccess ? "สำเร็จ!" : "เกิดข้อผิดพลาด"}
            </Text>
            <Text style={styles.modalText}>{message}</Text>

            <TouchableOpacity
              style={[
                styles.okButton,
                { backgroundColor: isSuccess ? "#4CAF50" : "#e50914" },
              ]}
              onPress={handleCloseModal}
            >
              <Text style={styles.okText}>ตกลง</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#1a1a1a" },
  title: { fontSize: 26, fontWeight: "700", color: "#fff", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingHorizontal: 20,
    color: "#fff",
    height: 50,
    marginBottom: 15,
  },
  button: { backgroundColor: "#e50914", paddingVertical: 15, borderRadius: 12 },
  buttonText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#222",
    borderRadius: 18,
    padding: 25,
    width: "80%",
    alignItems: "center",
    shadowColor: "#e50914",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  modalText: { color: "#fff", textAlign: "center", fontSize: 16, marginBottom: 20 },
  okButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 30 },
  okText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
