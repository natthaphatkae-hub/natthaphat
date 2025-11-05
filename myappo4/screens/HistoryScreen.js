import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BASE_URL } from "../config";
import { useNavigation, useFocusEffect, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function HistoryScreen({ route }) {
  const { user } = route.params;
  const navigation = useNavigation();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  // โหลดประวัติ
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/history/${user.userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) => new Date(b.viewed_at) - new Date(a.viewed_at)
        );
        setHistory(sorted);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // ลบรายการเดียว
  const deleteHistoryItem = (id) => {
    Alert.alert("ลบประวัติ", "คุณต้องการลบรายการนี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${BASE_URL}/history/${id}`, { method: "DELETE" });
            showToast("ลบประวัติเรียบร้อย");
            fetchHistory();

            // รีหน้า Home
            navigation.dispatch(
              CommonActions.navigate({
                name: "Home",
                params: { refresh: true },
              })
            );
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  // ลบทั้งหมด
  const deleteAllHistory = () => {
    if (history.length === 0) return showToast("ยังไม่มีประวัติให้ลบ");
    Alert.alert("ลบทั้งหมด", "คุณต้องการลบประวัติทั้งหมดใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบทั้งหมด",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/history/all/${user.userId}`, { method: "DELETE" });
            const data = await res.json();
            showToast(data.message || "ลบประวัติทั้งหมดเรียบร้อย");
            fetchHistory();

            // รีหน้า Home
            navigation.dispatch(
              CommonActions.navigate({
                name: "Home",
                params: { refresh: true },
              })
            );
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={{ flexDirection: "row", flex: 1, alignItems: "center" }}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("MovieDetail", { movieId: item.movie_id, user })
        }
      >
        <Image
          source={{ uri: `${BASE_URL}/posters/${item.poster}` }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.date}>
            ดูเมื่อ: {new Date(item.viewed_at).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteHistoryItem(item.id)}
      >
        <Ionicons name="trash" size={24} color="#e50914" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {toastMsg ? (
        <View style={styles.toastTop}>
          <Text style={{ color: "#fff" }}>{toastMsg}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#e50914" />
        <Text style={styles.backText}>กลับ</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>ประวัติการเข้าชม</Text>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ยังไม่มีประวัติการดูหนัง</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        />
      )}

      <View style={styles.deleteAllContainer}>
        <TouchableOpacity style={styles.deleteAllButton} onPress={deleteAllHistory}>
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={styles.deleteAllText}>ลบทั้งหมด</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", paddingTop: 60 },
  containerCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" },
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginHorizontal: 12, marginBottom: 20 },
  backText: { color: "#e50914", fontSize: 18, fontWeight: "700", marginLeft: 5 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginHorizontal: 12, marginBottom: 12 },
  card: { flexDirection: "row", backgroundColor: "#1f1f1f", borderRadius: 14, marginBottom: 12, overflow: "hidden", alignItems: "center", elevation: 5 },
  poster: { width: 100, height: 150 },
  info: { flex: 1, padding: 12 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  date: { color: "#ccc", fontSize: 14 },
  deleteButton: { padding: 10 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#fff", fontSize: 18 },
  toastTop: { position: "absolute", top: 60, left: 20, right: 20, backgroundColor: "#28a745", padding: 10, borderRadius: 8, alignItems: "center", zIndex: 1000 },
  deleteAllContainer: { position: "absolute", bottom: 20, left: 20, right: 20 },
  deleteAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "#e50914", borderRadius: 8 },
  deleteAllText: { color: "#fff", fontWeight: "700", marginLeft: 8, fontSize: 16 },
});
