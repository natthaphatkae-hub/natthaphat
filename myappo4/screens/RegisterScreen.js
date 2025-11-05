import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BASE_URL } from "../config";

const backgroundImage = require("../assets/piclab04/re.jpg");

export default function RegisterScreen({ navigation }) {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("error");

  const showToast = (msg, type = "error") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // เลือกรูปภาพ
  const pickImage = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) setProfilePicture(file);
        };
        input.click();
      } else {
        // ขอสิทธิ์เข้าถึงรูปภาพ
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showToast("ไม่สามารถเข้าถึงรูปภาพได้", "error");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled) setProfilePicture(result.assets[0].uri);
      }
    } catch (err) {
      console.log("ImagePicker error:", err);
      showToast("ไม่สามารถเลือกภาพได้", "error");
    }
  };

  // สมัครสมาชิก
  const handleRegister = async () => {
    if (!firstname || !lastname || !email || !password) {
      showToast("กรุณากรอกข้อมูลให้ครบ", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("first_name", firstname);
      formData.append("last_name", lastname);
      formData.append("email", email);
      formData.append("password", password);

      if (profilePicture) {
        if (Platform.OS === "web") {
          formData.append("profile", profilePicture, profilePicture.name);
        } else {
          const filename = profilePicture.split("/").pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image";
          formData.append("profile", { uri: profilePicture, name: filename, type });
        }
      }

      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = await res.json();
      if (res.status === 200) {
        showToast(data.message || "สมัครสมาชิกสำเร็จ", "success");
        setFirstname("");
        setLastname("");
        setEmail("");
        setPassword("");
        setProfilePicture(null);
        setTimeout(() => navigation.navigate("Login"), 1500);
      } else {
        showToast(data.error || data.message || "ไม่สามารถสมัครสมาชิกได้", "error");
      }
    } catch (err) {
      console.log("Register error:", err);
      showToast("ไม่สามารถเชื่อมต่อ server ได้", "error");
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Text style={styles.title}>สมัครสมาชิก</Text>

        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {profilePicture ? (
            <Image
              source={
                Platform.OS === "web"
                  ? { uri: URL.createObjectURL(profilePicture) }
                  : { uri: profilePicture }
              }
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="camera" size={36} color="#aaa" />
            </View>
          )}
          {!profilePicture && <Text style={styles.avatarText}>เลือกรูปโปรไฟล์</Text>}
        </TouchableOpacity>

        <TextInput
          placeholder="ชื่อ"
          placeholderTextColor="#7a7575ff"
          value={firstname}
          onChangeText={setFirstname}
          style={styles.input}
        />
        <TextInput
          placeholder="นามสกุล"
          placeholderTextColor="#7a7575ff"
          value={lastname}
          onChangeText={setLastname}
          style={styles.input}
        />
        <TextInput
          placeholder="อีเมล"
          placeholderTextColor="#7a7575ff"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="รหัสผ่าน"
            placeholderTextColor="#7a7575ff"
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

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>สมัครสมาชิก</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.link}>
          <Text style={styles.linkText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
        </TouchableOpacity>
      </View>

      {toastMsg ? (
        <View style={[styles.toast, { backgroundColor: toastType === "success" ? "#28a745" : "#e50914" }]}>
          <Text style={{ color: "#fff" }}>{toastMsg}</Text>
        </View>
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)" },
  container: { width: "85%", backgroundColor: "#1a1a1a", padding: 30, borderRadius: 20, elevation: 10 },
  title: { fontSize: 32, fontWeight: "700", color: "#fff", marginBottom: 25, textAlign: "center" },
  avatarContainer: { alignItems: "center", marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "#e50914" },
  avatarPlaceholder: { backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#aaa", fontSize: 14, textAlign: "center", marginTop: 5, width: 120 },
  input: { backgroundColor: "#aaa", borderRadius: 12, paddingHorizontal: 20, fontSize: 16, color: "#2a2a2a", height: 50, marginBottom: 15 },
  passwordContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#aaa", borderRadius: 12, height: 50, marginBottom: 15 },
  passwordInput: { flex: 1, paddingHorizontal: 20, fontSize: 16, color: "#2a2a2a", height: 50 },
  eyeButton: { paddingHorizontal: 10 },
  button: { backgroundColor: "#e50914", paddingVertical: 15, borderRadius: 12, marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 18, textAlign: "center" },
  link: { marginTop: 15, alignItems: "center" },
  linkText: { color: "#aaa", textDecorationLine: "underline" },
  toast: { position: "absolute", top: 20, left: 20, right: 20, padding: 10, borderRadius: 8, alignItems: "center" },
});
