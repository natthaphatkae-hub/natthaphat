// screens/EditUserScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";

export default function EditUserScreen({ route, navigation }) {
  const { user } = route.params;

  const [firstname, setFirstname] = useState(user.first_name || "");
  const [lastname, setLastname] = useState(user.last_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileUri, setProfileUri] = useState(
    user.profile ? `${BASE_URL}/uploads/profile/${user.profile}` : null
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success", duration = 3000) => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), duration);
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            setProfileUri(URL.createObjectURL(file));
            setSelectedFile(file);
          }
        };
        input.click();
      } else {
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
        if (!result.canceled) {
          const uri = result.assets[0].uri;
          setProfileUri(uri);
          const filename = uri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image";
          setSelectedFile({ uri, name: filename, type });
        }
      }
    } catch (err) {
      console.log("ImagePicker error:", err);
      showToast("ไม่สามารถเลือกภาพได้", "error");
    }
  };

  const handleSave = async () => {
    if (!firstname || !lastname || !email) {
      showToast("กรุณากรอกข้อมูลให้ครบ", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("first_name", firstname);
      formData.append("last_name", lastname);
      formData.append("email", email);
      if (newPassword) formData.append("newPassword", newPassword);
      if (selectedFile) {
        if (Platform.OS === "web") {
          formData.append("profile", selectedFile, selectedFile.name);
        } else {
          formData.append("profile", selectedFile);
        }
      }

      const res = await fetch(`${BASE_URL}/users/${user.userId}`, {
        method: "PUT",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        showToast("บันทึกข้อมูลสมาชิกเรียบร้อย", "success");
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showToast(data.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch (err) {
      console.log(err);
      showToast("เกิดข้อผิดพลาด: " + (err.message || ""), "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 60,
          paddingHorizontal: 20,
          flexGrow: 1,
          backgroundColor: "#000",
        }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#e50914" />
          <Text style={styles.backText}>กลับ</Text>
        </TouchableOpacity>

        <Text style={styles.header}>แก้ไขสมาชิก</Text>

        <TouchableOpacity onPress={pickImage} style={{ alignItems: "center" }}>
          {profileUri ? (
            <Image source={{ uri: profileUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
              <Ionicons name="camera" size={40} color="#aaa" />
              <Text style={{ color: "#aaa", marginTop: 6 }}>เลือกรูปโปรไฟล์</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>ชื่อ:</Text>
          <TextInput value={firstname} onChangeText={setFirstname} style={styles.input} />

          <Text style={styles.label}>นามสกุล:</Text>
          <TextInput value={lastname} onChangeText={setLastname} style={styles.input} />

          <Text style={styles.label}>อีเมล:</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />

          <Text style={styles.label}>รหัสผ่านใหม่:</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="รหัสผ่านใหม่"
              placeholderTextColor="#777"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            {newPassword.length > 0 && (
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </TouchableOpacity>
      </ScrollView>

      {toastMsg ? (
        <View style={[styles.toast, { backgroundColor: toastType === "success" ? "#28a745" : "#e50914" }]}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{toastMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#000" },
  backButton: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", marginBottom: 10 },
  backText: { color: "#e50914", fontSize: 18, marginLeft: 5, fontWeight: "700" },
  header: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 20, alignSelf: "flex-start" },
  avatar: { width: 140, height: 140, borderRadius: 70, marginBottom: 20, borderWidth: 2, borderColor: "#e50914" },
  placeholder: { backgroundColor: "#222", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#e50914" },
  infoContainer: { width: "100%", backgroundColor: "#111", borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: "#e50914" },
  label: { color: "#888", fontSize: 16, marginTop: 10 },
  input: { backgroundColor: "#222", color: "#fff", borderRadius: 8, paddingHorizontal: 10, height: 40, marginTop: 5 },
  passwordContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#222", borderRadius: 8, height: 40, marginTop: 5 },
  passwordInput: { flex: 1, paddingHorizontal: 10, color: "#fff", height: 40 },
  eyeButton: { paddingHorizontal: 10 },
  saveButton: { backgroundColor: "#28a745", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12, marginTop: 10 ,alignSelf: "center"},
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
  toast: { position: "absolute", top: 50, left: 20, right: 20, padding: 12, borderRadius: 8, alignItems: "center", zIndex: 1000 },
});
