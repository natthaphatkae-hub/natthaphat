import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { BASE_URL } from "../config";
import { requestNotificationPermission, sendLocalNotification } from "../helpers/notificationHelper";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) return alert("กรุณากรอกอีเมล");

    setLoading(true);

    try {
      // ขออนุญาต Notification
      const allowed = await requestNotificationPermission();
      if (!allowed) return;

      // ส่ง OTP ไป server
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        // แสดง Local Notification
        await sendLocalNotification("📩 รหัส OTP ของคุณ", `OTP คือ ${data.otp}`);

        // ไปหน้า ResetPasswordScreen พร้อมส่ง email
        navigation.navigate("ResetPassword", { email });
      } else {
        alert(data.error || "ไม่สามารถส่ง OTP ได้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ลืมรหัสผ่าน</Text>

      <TextInput
        placeholder="อีเมลของคุณ"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>ส่ง OTP</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#0d0d0d" },
  title: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "#1c1c1c",
    borderRadius: 10,
    paddingHorizontal: 20,
    color: "#fff",
    height: 50,
    marginBottom: 15,
  },
  button: { backgroundColor: "#e50914", borderRadius: 10, paddingVertical: 15 },
  text: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 18 },
});
