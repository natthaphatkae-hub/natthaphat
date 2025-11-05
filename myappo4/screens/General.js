// screens/General.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { BASE_URL } from "../config";

const screenWidth = Dimensions.get("window").width;
const numColumns = 2;
const posterMaxWidth = 160;
const posterWidth = Math.min(screenWidth / numColumns - 30, posterMaxWidth);
const posterHeight = posterWidth * 1.5;

export default function General({ navigation, route }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [fetchError, setFetchError] = useState(false);

  const user = route?.params?.user || { id: 0, type: "guest", firstname: "Guest" };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${BASE_URL}/movies`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Data is not an array");
        setMovies(data);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  // Filter + Sort movies
  const filteredMovies = movies
    .filter(
      movie =>
        movie.title.toLowerCase().includes(searchText.toLowerCase()) &&
        (selectedCategory === "All" || movie.category === selectedCategory)
    )
    .map(movie => ({
      ...movie,
      average_rating:
        movie.average_rating !== null && movie.average_rating !== undefined
          ? Number(movie.average_rating)
          : 0,
    }))
    .sort((a, b) => b.average_rating - a.average_rating) // เรียงจากมากไปน้อย
    .slice(0, 10);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate("MovieDetail", { movieId: item.id, user })}
    >
      {item.poster ? (
        <Image
          source={{ uri: `${BASE_URL}/posters/${item.poster}` }}
          style={styles.poster}
          resizeMode="cover"
          onError={() => console.log("Image load fail:", item.poster)}
        />
      ) : (
        <View style={[styles.poster, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#fff" }}>No Image</Text>
        </View>
      )}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.ratingText}>{item.average_rating.toFixed(1)} ★</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#fff", textAlign: "center" }}>
          ไม่สามารถเชื่อมต่อ server ได้{'\n'}ตรวจสอบ network / BASE_URL
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>ThaiMovies</Text>

      <View style={styles.searchWrapper}>
        <TextInput
          placeholder="ค้นหาหนัง..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.categoryContainer}>
        {["All", "โรแมนติก", "ดราม่า", "ตลก", "สยองขวัญ", "แอคชั่น"].map(c => (
          <TouchableOpacity key={c} onPress={() => setSelectedCategory(c)}>
            <Text
              style={[
                styles.categoryItem,
                selectedCategory === c && { color: "#e50914", fontWeight: "700" },
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredMovies.length === 0 ? (
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>ไม่พบหนัง</Text>
      ) : (
        <FlatList
          data={filteredMovies}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {user.type === "guest" && (
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.button, { marginRight: 5 }]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#444", marginLeft: 5 }]}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.buttonText}>สมัครสมาชิก</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 30 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#e50914",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 20,
  },
  searchWrapper: { alignItems: "center", marginBottom: 10 },
  searchInput: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    width: "90%",
  },
  categoryContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  categoryItem: { color: "#fff", fontSize: 14 },
  card: { flex: 1, margin: 5, alignItems: "center" },
  poster: { width: posterWidth, height: posterHeight, borderRadius: 12, backgroundColor: "#222" },
  title: { color: "#fff", marginTop: 8, fontSize: 16, fontWeight: "700", textAlign: "center" },
  ratingText: { color: "#FFD700", fontWeight: "700", marginTop: 2, fontSize: 14 },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#000",
  },
  button: { flex: 1, backgroundColor: "#e50914", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
});
