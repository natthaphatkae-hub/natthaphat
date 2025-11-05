import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BASE_URL } from "../config";

// Toast component
const Toast = ({ message, type = "error", onHide, index = 0, duration = 2500 }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 50 + index * 70,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onHide) onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const backgroundColor = type === "success" ? "#28a745" : "#dc3545";

  return (
    <Animated.View
      style={{
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
        zIndex: 9999,
        transform: [{ translateY }],
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>
        {message}
      </Text>
    </Animated.View>
  );
};

export default function ProfileScreen({ navigation, route }) {
  const user = route.params?.user || {};

  const [isEditing, setIsEditing] = useState(false);
  const [firstname, setFirstname] = useState(user.first_name || "");
  const [lastname, setLastname] = useState(user.last_name || "");
  const [profileUri, setProfileUri] = useState(
    user.profile ? `${BASE_URL}/uploads/profile/${user.profile}` : null
  );
  const [selectedFile, setSelectedFile] = useState(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toast state
  const [toastList, setToastList] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToastList((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToastList((prev) => prev.filter((t) => t.id !== id));
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

 const handleSaveProfile = async () => {
  if ((oldPassword || newPassword || confirmPassword) && (!oldPassword || !newPassword || !confirmPassword)) {
    showToast("กรุณากรอกข้อมูลรหัสผ่านให้ครบ", "error");
    return;
  }
  if (newPassword && newPassword !== confirmPassword) {
    showToast("รหัสผ่านใหม่ไม่ตรงกัน", "error");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("id", user.userId);
    formData.append("first_name", firstname);
    formData.append("last_name", lastname);
    if (oldPassword) formData.append("oldPassword", oldPassword);
    if (newPassword) formData.append("newPassword", newPassword);
    if (selectedFile) {
      if (Platform.OS === "web") {
        formData.append("profile", selectedFile, selectedFile.name);
      } else {
        formData.append("profile", selectedFile);
      }
    }

    const res = await fetch(`${BASE_URL}/updateProfile`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    const data = await res.json();

    if (data.success) {
      setIsEditing(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const newProfileUri = data.profile ? `${BASE_URL}/uploads/profile/${data.profile}` : profileUri;
      setProfileUri(newProfileUri);
      setSelectedFile(null);

      // อัปเดต user state
      const updatedUser = {
        ...user,
        first_name: firstname,
        last_name: lastname,
        profile: data.profile || user.profile,
      };

      // โชว์ Toast อยู่หน้าเดิม
      showToast("บันทึกข้อมูลเรียบร้อย", "success");

      // รอ 2.5 วิ แล้ว navigate ไปหน้า Home พร้อมส่ง updatedUser
      setTimeout(() => {
        navigation.navigate("Home", { updatedUser });
      }, 2500);
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
      {/* Toast Stack */}
      {toastList.map((t, i) => (
        <Toast key={t.id} message={t.message} type={t.type} index={i} onHide={() => removeToast(t.id)} />
      ))}

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#e50914" />
          <Text style={styles.backText}>กลับ</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>โปรไฟล์</Text>

        <TouchableOpacity onPress={isEditing ? pickImage : null} style={{ alignItems: "center" }}>
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
          {isEditing ? <TextInput value={firstname} onChangeText={setFirstname} style={styles.input} /> : <Text style={styles.infoText}>{firstname}</Text>}

          <Text style={styles.label}>นามสกุล:</Text>
          {isEditing ? <TextInput value={lastname} onChangeText={setLastname} style={styles.input} /> : <Text style={styles.infoText}>{lastname}</Text>}

          <Text style={styles.label}>อีเมล:</Text>
          <Text style={styles.infoText}>{user.email || ""}</Text>

          {isEditing && (
            <>
              <Text style={styles.label}>รหัสผ่านเดิม:</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="รหัสผ่านเดิม"
                  placeholderTextColor="#777"
                  secureTextEntry={!showOldPassword}
                  style={styles.passwordInput}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                {oldPassword.length > 0 && (
                  <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeButton}>
                    <Ionicons name={showOldPassword ? "eye-off" : "eye"} size={24} color="gray" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>รหัสผ่านใหม่:</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="รหัสผ่านใหม่"
                  placeholderTextColor="#777"
                  secureTextEntry={!showNewPassword}
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                {newPassword.length > 0 && (
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                    <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={24} color="gray" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>ยืนยันรหัสผ่านใหม่:</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  placeholderTextColor="#777"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {confirmPassword.length > 0 && (
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="gray" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        {isEditing ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
            <Text style={styles.saveButtonText}>บันทึก</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>แก้ไขข้อมูล</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 60, paddingHorizontal: 20, alignItems: "center", flexGrow: 1, backgroundColor: "#000" },
  backButton: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", marginBottom: 10 },
  backText: { color: "#e50914", fontSize: 18, marginLeft: 5, fontWeight: "700" },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "700", alignSelf: "flex-start", marginBottom: 20 },
  avatar: { width: 140, height: 140, borderRadius: 70, marginBottom: 20, borderWidth: 2, borderColor: "#e50914" },
  placeholder: { backgroundColor: "#222", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#e50914" },
  infoContainer: { width: "100%", backgroundColor: "#111", borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: "#e50914" },
  label: { color: "#888", fontSize: 16, marginTop: 10 },
  infoText: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 2 },
  input: { backgroundColor: "#222", color: "#fff", borderRadius: 8, paddingHorizontal: 10, height: 40, marginTop: 5 },
  passwordContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#222", borderRadius: 12, height: 50, marginTop: 5 },
  passwordInput: { flex: 1, paddingHorizontal: 20, fontSize: 16, color: "#fff", height: 50 },
  eyeButton: { paddingHorizontal: 10 },
  editButton: { backgroundColor: "#e50914", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12, marginTop: 10 },
  editButtonText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
  saveButton: { backgroundColor: "#28a745", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12, marginTop: 10 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
});
