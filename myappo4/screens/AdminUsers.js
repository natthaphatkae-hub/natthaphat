// screens/AdminUsers.js
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { useFocusEffect } from "@react-navigation/native";

export default function AdminUsers({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    // สำหรับ Toast
    const [toastMsg, setToastMsg] = useState("");
    const [toastType, setToastType] = useState("success");

    const showToast = (msg, type = "success", duration = 2500) => {
        setToastMsg(msg);
        setToastType(type);
        setTimeout(() => setToastMsg(""), duration);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/users`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Error fetching users:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUsers();
        }, [])
    );

    const deleteUser = (id) => {
        Alert.alert("ลบสมาชิก", "คุณต้องการลบสมาชิกนี้ใช่หรือไม่?", [
            { text: "ยกเลิก", style: "cancel" },
            {
                text: "ลบ",
                style: "destructive",
                onPress: async () => {
                    try {
                        await fetch(`${BASE_URL}/users/${id}`, { method: "DELETE" });
                        fetchUsers();
                        showToast("ลบสมาชิกเรียบร้อยแล้ว", "success"); // แสดง Toast แทน Alert
                    } catch (err) {
                        console.error(err);
                        showToast("ไม่สามารถลบสมาชิกได้", "error");
                    }
                },
            },
        ]);
    };

    const filteredUsers = users.filter(
        (user) =>
            user.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.userInfo}>
                <View style={styles.userRow}>
                    {item.profile ? (
                        <Image
                            source={{ uri: `${BASE_URL}/uploads/profile/${item.profile}` }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.cameraPlaceholder]}>
                            <Ionicons name="camera" size={24} color="#888" />
                        </View>
                    )}
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                        <Text style={styles.email}>{item.email}</Text>
                    </View>
                </View>
            </View>
            <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate("EditUser", { user: item })}
                >
                    <Text style={styles.editText}>แก้ไข</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteUser(item.userId)}
                >
                    <Text style={styles.deleteText}>ลบ</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#e50914" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* หัวข้อ */}
            <Text style={styles.headerTitle}>รายชื่อสมาชิก</Text>

            <TextInput
                placeholder="ค้นหาสมาชิก..."
                placeholderTextColor="#888"
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
            />

            {filteredUsers.length === 0 ? (
                <View style={styles.center}>
                    <Text style={{ color: "#fff" }}>ไม่พบสมาชิก</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.userId.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
                />
            )}

            {/* Toast ลอยบน */}
            {toastMsg !== "" && (
                <View
                    style={[
                        styles.toast,
                        { backgroundColor: toastType === "success" ? "#28a745" : "#e50914" },
                    ]}
                >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>{toastMsg}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#121212", padding: 12, paddingTop: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    searchInput: {
        backgroundColor: "#1f1f1f",
        color: "#fff",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 45,
        marginBottom: 16,
    },
    card: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#1f1f1f",
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    userInfo: { flex: 1 },
    userRow: { flexDirection: "row", alignItems: "center" },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#333" },
    cameraPlaceholder: { justifyContent: "center", alignItems: "center" },
    name: { color: "#fff", fontSize: 16, fontWeight: "700" },
    email: { color: "#ccc", fontSize: 14, marginTop: 2 },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#e5a500",
        borderRadius: 8,
        marginRight: 8,
    },
    editText: { color: "#fff", fontWeight: "700" },
    deleteButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#e50914",
        borderRadius: 8,
    },
    deleteText: { color: "#fff", fontWeight: "700" },
    toast: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        zIndex: 1000,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 12,
    }
});
