// Home.js
import React, { useEffect, useState, useRef } from "react";
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
  ScrollView,
  Animated,
} from "react-native";
import { BASE_URL } from "../config";

const screenWidth = Dimensions.get("window").width;
const numColumns = 2;
const posterMaxWidth = 160;
const posterWidth = Math.min(screenWidth / numColumns - 30, posterMaxWidth);
const posterHeight = posterWidth * 1.5;

// Toast Component
const Toast = ({ message, type = "error", duration = 2500, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: 40,
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

  const backgroundColor = type === "error" ? "#e50914" : "#28a745";

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
        zIndex: 5000,
        transform: [{ translateY }],
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>
        {message}
      </Text>
    </Animated.View>
  );
};

export default function Home({ navigation, route }) {
  const [movies, setMovies] = useState([]);
  const [history, setHistory] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredMoviesByCategory, setFilteredMoviesByCategory] = useState([]);

  const scrollRef = useRef();

  const userFromRoute = route.params?.user;
  const [currentUser, setCurrentUser] = useState({
    userId: userFromRoute?.userId ?? 0,
    first_name: userFromRoute?.first_name ?? "Admin",
    last_name: userFromRoute?.last_name ?? "",
    profile: userFromRoute?.profile ?? null,
    email: userFromRoute?.email ?? "admin@example.com",
    role: userFromRoute?.role ?? "admin",
  });

  const [profileUri, setProfileUri] = useState(
    currentUser.profile
      ? `${BASE_URL}/uploads/profile/${currentUser.profile}`
      : `${BASE_URL}/uploads/profile/default.png`
  );

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("error");

  useEffect(() => {
    if (route.params?.updatedUser) {
      const updated = route.params.updatedUser;
      setCurrentUser(updated);
      setProfileUri(
        updated.profile
          ? `${BASE_URL}/uploads/profile/${updated.profile}`
          : `${BASE_URL}/uploads/profile/default.png`
      );
    }
  }, [route.params?.updatedUser]);

  const loadMovies = () => {
    setLoading(true);
    fetch(`${BASE_URL}/movies`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMovies();
  }, []);

useEffect(() => {
  const unsubscribe = navigation.addListener("focus", () => {
    loadMovies();
    loadHistory();
  });

  // ถ้า HistoryScreen ส่ง refresh = true มา → โหลดใหม่
  if (route.params?.refresh) {
    loadHistory();
    navigation.setParams({ refresh: false }); // รีเซ็ต flag
  }

  return unsubscribe;
}, [navigation, route.params?.refresh]);


  const loadHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/history/${currentUser.userId}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setHistory([]);
    }
  };

  // Recommended movies
  useEffect(() => {
    if (history.length > 0 && movies.length > 0) {
      const categoryCount = {};
      history.forEach((item) => {
        const movie = movies.find((m) => m.id === item.movie_id);
        if (movie) {
          categoryCount[movie.category] = (categoryCount[movie.category] || 0) + 1;
        }
      });

      const mostWatchedCategory = Object.keys(categoryCount).reduce((a, b) =>
        categoryCount[a] > categoryCount[b] ? a : b
      );

      const recommendedMovies = movies.filter(
        (movie) =>
          movie.category === mostWatchedCategory &&
          !history.some((h) => h.movie_id === movie.id)
      );

      setRecommended(recommendedMovies.slice(0, 4));
    }
  }, [history, movies]);

  // Filter movies
  useEffect(() => {
    const filtered = movies
      .filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchText.toLowerCase()) &&
          (selectedCategory === "All" || movie.category === selectedCategory)
      )
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    setFilteredMoviesByCategory(filtered);
  }, [movies, selectedCategory, searchText]);

  // New movies
  const newMovies = [...movies]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  const handlePressMovie = (movie) => {
    navigation.navigate("MovieDetail", { movieId: movie.id, user: currentUser });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePressMovie(item)}>
      {item.poster ? (
        <Image source={{ uri: `${BASE_URL}/posters/${item.poster}` }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#fff" }}>No Image</Text>
        </View>
      )}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.rating}>
        {(item.average_rating !== null && item.average_rating !== undefined
          ? Number(item.average_rating).toFixed(1)
          : "0.0")}{" "}
        ★
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Thai Movies</Text>
          <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(true)}>
            <View style={styles.bar} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="ค้นหาหนัง..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {selectedCategory === "All" ? (
          <>
            {recommended.length > 0 && (
              <>
                <Text style={styles.categoryHeader}>แนะนำสำหรับคุณ</Text>
                <FlatList
                  data={recommended}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  numColumns={numColumns}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
                />
              </>
            )}

            <Text style={styles.newHeader}>หนังใหม่</Text>
            <FlatList
              data={newMovies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              numColumns={numColumns}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
            />

            <Text style={styles.categoryHeader}>หนังยอดนิยม</Text>
            <FlatList
              data={filteredMoviesByCategory.slice(0, 4)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              numColumns={numColumns}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
            />
          </>
        ) : (
          <>
            <Text style={styles.categoryHeader}>หมวดหมู่: {selectedCategory}</Text>
            <FlatList
              data={filteredMoviesByCategory.slice(0, 10)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              numColumns={numColumns}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
            />
          </>
        )}
      </ScrollView>

      {/* Hamburger Menu */}
      {menuOpen && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />
          <View style={styles.sideMenu}>
            <ScrollView>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>x</Text>
              </TouchableOpacity>

              <View style={styles.profileHeader}>
                <Image
                  source={{ uri: profileUri }}
                  style={styles.profileAvatar}
                  onError={() => {
                    if (profileUri !== `${BASE_URL}/uploads/profile/default.png`) {
                      setProfileUri(`${BASE_URL}/uploads/profile/default.png`);
                    }
                  }}
                />
                <Text style={styles.profileName}>
                  {currentUser.first_name} {currentUser.last_name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory("All");
                  setMenuOpen(false);
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Text style={styles.menuItem}>หน้าแรก</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCategoryOpen(!categoryOpen)}>
                <Text style={styles.menuItem}>
                  หมวดหมู่ {categoryOpen ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {categoryOpen && (
                <View style={styles.subMenu}>
                  {["โรแมนติก", "ดราม่า", "ตลก", "สยองขวัญ", "แอคชั่น"].map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => {
                        setSelectedCategory(c);
                        setMenuOpen(false);
                        scrollRef.current?.scrollTo({ y: 0, animated: true });
                      }}
                    >
                      <Text style={styles.subMenuItem}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate("Profile", {
                    user: currentUser,
                    from: "Home",
                  });
                }}
              >
                <Text style={styles.menuItem}>โปรไฟล์</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate("History", { user: currentUser });
                }}
              >
                <Text style={styles.menuItem}>ประวัติการเข้าชม</Text>
              </TouchableOpacity>

              {currentUser.role === "admin" && (
                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate("AdminDashboard", { user: currentUser });
                  }}
                >
                  <Text style={styles.menuItem}>สำหรับแอดมิน</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setToastMsg("ออกจากระบบเรียบร้อย");
                  setToastType("error");
                  setMenuOpen(false);

                  setTimeout(() => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "Login" }],
                    });
                  }, 1500);
                }}
              >
                <Text style={[styles.menuItem, { color: "#e50914" }]}>ออกจากระบบ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </>
      )}

      {toastMsg && <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 20 },
  headerContainer: { paddingHorizontal: 10, marginBottom: 15 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 40,
  },
  headerTitle: { fontSize: 28, color: "#e50914", fontWeight: "700" },
  searchInput: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 8,
  },
  categoryHeader: { fontSize: 20, fontWeight: "600", color: "#fff", marginTop: 5 },
  newHeader: { fontSize: 20, fontWeight: "700", color: "#fff", marginTop: 5 },
  hamburger: { width: 35, height: 30, justifyContent: "space-between", alignItems: "center" },
  bar: { width: 28, height: 3, backgroundColor: "#fff", borderRadius: 1.5 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 2000,
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 250,
    height: "110%",
    backgroundColor: "#111",
    paddingTop: 100,
    paddingHorizontal: 20,
    zIndex: 2500,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  closeBtn: { position: "absolute", top: 60, right: 20 },
  closeText: { fontSize: 30, color: "#fff" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e50914",
    backgroundColor: "#333",
  },
  profileName: { color: "#fff", fontSize: 18, fontWeight: "700", flexShrink: 1 },
  menuItem: { fontSize: 18, color: "#fff", marginVertical: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#333" },
  subMenu: { paddingLeft: 15, marginTop: 5, marginBottom: 15 },
  subMenuItem: { fontSize: 14, color: "#ccc", marginVertical: 6, paddingVertical: 4 },
  card: { flex: 1, margin: 5, alignItems: "center" },
  poster: { width: posterWidth, height: posterHeight, borderRadius: 12, backgroundColor: "#222" },
  title: { color: "#fff", marginTop: 8, fontSize: 16, fontWeight: "700", textAlign: "center" },
  rating: { color: "#FFD700", marginTop: 4, fontWeight: "700" },
});
