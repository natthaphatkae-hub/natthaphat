import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";

export default function AdminMovies({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

  // ✅ Toast state
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("error");

  const categories = ["ทั้งหมด", "โรแมนติก", "ดราม่า", "ตลก", "สยองขวัญ", "แอคชั่น"];

  // ✅ Toast function
  const showToast = (msg, type = "error") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    fetchMovies();
    const unsubscribe = navigation.addListener("focus", fetchMovies);
    return unsubscribe;
  }, [navigation]);

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${BASE_URL}/movies`);
      const data = await res.json();
      setMovies(data);
    } catch (err) {
      console.error(err);
      showToast("ไม่สามารถดึงข้อมูลหนังได้");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("ยืนยัน", "ต้องการลบหนังนี้?", [
      { text: "ยกเลิก" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/movies/${id}`, { method: "DELETE" });
            if (res.ok) {
              fetchMovies();
              showToast("ลบหนังเรียบร้อย", "success"); // ✅ Toast
            } else {
              showToast("ไม่สามารถลบหนังได้");
            }
          } catch (err) {
            console.error(err);
            showToast("ไม่สามารถลบหนังได้");
          }
        },
      },
    ]);
  };

  const openAddMovie = () => {
    navigation.navigate("AddMovie");
  };

  const openEditMovie = (movie) => {
    navigation.navigate("AddMovie", { movie });
  };

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ทั้งหมด" || movie.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderMovie = ({ item }) => (
    <View style={styles.card}>
      {item.poster ? (
        <Image source={{ uri: `${BASE_URL}/posters/${item.poster}` }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.placeholder]}>
          <Ionicons name="film-outline" size={40} color="#aaa" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ffc107" }]}
            onPress={() => openEditMovie(item)}
          >
            <Ionicons name="create-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#dc3545" }]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>จัดการหนัง</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="ค้นหาหนัง..."
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              selectedCategory === cat && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredMovies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMovie}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.addButton} onPress={openAddMovie}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ✅ Toast */}
      {toastMsg ? (
        <View
          style={[
            styles.toast,
            { backgroundColor: toastType === "success" ? "#28a745" : "#e50914" },
          ]}
        >
          <Text style={{ color: "#fff" }}>{toastMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 16, paddingTop: 50 },
  header: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 16 },
  searchInput: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#111",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
    minWidth: "30%",
    alignItems: "center",
  },
  categoryButtonActive: { backgroundColor: "#e50914", borderColor: "#e50914" },
  categoryText: { color: "#aaa", fontSize: 14 },
  categoryTextActive: { color: "#fff", fontWeight: "700" },
  card: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
  },
  poster: { width: 100, height: 140 },
  placeholder: { justifyContent: "center", alignItems: "center", backgroundColor: "#222" },
  info: { flex: 1, padding: 12, justifyContent: "space-between" },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  category: { color: "#bbb", fontSize: 14, marginTop: 4 },
  actions: { flexDirection: "row", marginTop: 10 },
  button: { padding: 8, borderRadius: 6, marginRight: 10 },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#e50914",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  toast: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 1000,
  },
});
