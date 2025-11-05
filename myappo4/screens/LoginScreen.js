import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";

const backgroundImage = require("../assets/piclab04/in.jpg");

const Toast = ({ message, type = "error", duration = 2500, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.timing(translateY, { toValue: 40, duration: 400, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -100, duration: 400, useNativeDriver: true }).start(() => onHide && onHide());
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const backgroundColor = type === "error" ? "#dc3545" : "#28a745";

  return (
    <Animated.View style={{
      position: "absolute",
      top: 0,
      left: "50%",
      marginLeft: -150,
      width: 300,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor,
      zIndex: 1000,
      transform: [{ translateY }],
    }}>
      <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{message}</Text>
    </Animated.View>
  );
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("error");
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = "error") => { setToastMsg(msg); setToastType(type); };

  const handleLogin = async () => {
    if (!email || !password) { showToast("กรุณากรอกอีเมลและรหัสผ่าน", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.role) {
        showToast("เข้าสู่ระบบสำเร็จ", "success");
        setTimeout(() => navigation.replace("Home", { user: data }), 800);
      } else {
        showToast(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("ไม่สามารถเชื่อมต่อ Server ได้", "error");
    } finally { setLoading(false); }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <TouchableOpacity style={styles.floatingBackButton} onPress={() => navigation.navigate("General")}>
        <Ionicons name="arrow-back" size={28} color="#e50914" />
        <Text style={styles.backText}>กลับ</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.containerWrapper}>
        <View style={styles.container}>
          <Text style={styles.title}>เข้าสู่ระบบหนังไทย</Text>
          <TextInput
            placeholder="อีเมล"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="รหัสผ่าน"
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
            />
            {password.length > 0 && (
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
              </TouchableOpacity>
            )}
          </View>

          {/* ลิงก์ลืมรหัสผ่าน */}
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotPasswordLink}>
            <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.link}>
            <Text style={styles.linkText}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {toastMsg && <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)" },
  containerWrapper: { flex: 1, justifyContent: "center", width: "100%", paddingHorizontal: 20 },
  container: { width: "100%", backgroundColor: "#1a1a1a", padding: 30, borderRadius: 20, elevation: 10 },
  floatingBackButton: { position: "absolute", top: 50, left: 20, zIndex: 100, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30 },
  backText: { color: "#e50914", fontSize: 18, fontWeight: "700", marginLeft: 6 },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 25, textAlign: "center" },
  input: { backgroundColor: "#333", borderRadius: 12, paddingHorizontal: 20, fontSize: 16, color: "#fff", height: 50, marginBottom: 15 },
  passwordContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#333", borderRadius: 12, height: 50, marginBottom: 15 },
  passwordInput: { flex: 1, paddingHorizontal: 20, fontSize: 16, color: "#fff", height: 50 },
  eyeButton: { paddingHorizontal: 10 },
  forgotPasswordLink: { marginBottom: 15, alignItems: "flex-end" },
  forgotPasswordText: { color: "#e50914", fontWeight: "600", textDecorationLine: "underline" },
  button: { backgroundColor: "#e50914", paddingVertical: 15, borderRadius: 12, marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 18, textAlign: "center" },
  link: { marginTop: 15, alignItems: "center" },
  linkText: { color: "#ccc", textDecorationLine: "underline" },
});
