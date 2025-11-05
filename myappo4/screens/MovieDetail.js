// screens/MovieDetail.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";

const screenWidth = Dimensions.get("window").width;

// Toast Component
const Toast = ({ message = "", type = "success", duration = 3000, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    Animated.timing(translateY, { toValue: 40, duration: 400, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -100, duration: 400, useNativeDriver: true }).start(() => {
        setVisible(false);
        onHide && onHide();
      });
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  const backgroundColor = type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#ffc107";

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: screenWidth / 2 - 150,
        transform: [{ translateY }],
        width: 300,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor,
        zIndex: 3000,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>{message}</Text>
    </Animated.View>
  );
};

export default function MovieDetail({ navigation, route }) {
  const { movieId, user, onUpdateRating } = route.params;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMsg(message);
    setToastType(type);
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        // โหลดหนัง
        const resMovie = await fetch(`${BASE_URL}/movies/${movieId}`);
        const movieData = await resMovie.json();
        setMovie(movieData);

        // บันทึกประวัติการเข้าชม
        if (user?.userId) {
          await fetch(`${BASE_URL}/history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.userId, movieId }),
          })
          .then(res => res.json())
          .then(data => console.log("History saved:", data))
          .catch(err => console.error("ไม่สามารถบันทึกประวัติ:", err));
        }

        // โหลดคอมเมนต์
        const resComments = await fetch(`${BASE_URL}/comments/${movieId}`);
        const commentsData = await resComments.json();
        setComments(commentsData);

      } catch (err) {
        console.error("Error loading movie or comments:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const submitComment = () => {
    if (!commentText || commentRating === 0) 
      return showToast("กรุณากรอกคอมเมนต์และให้ดาว", "error");

    fetch(`${BASE_URL}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movie_id: Number(movieId), // <-- แก้ตรงนี้
        user_id: user.userId,
        comment: commentText,
        rating: commentRating
      }),
    })
    .then(res => res.json())
    .then(data => {
      if(data.error) return showToast(data.error, "error");

      const newComment = {
        id: data.commentId,
        comment: commentText,
        rating: commentRating,
        firstname: user.first_name,
        lastname: user.last_name,
        profilePicture: user.profile || null,
      };
      setComments(prev => [newComment, ...prev]);
      setCommentText("");
      setCommentRating(0);

      // อัปเดต average_rating
      fetch(`${BASE_URL}/movies/${movieId}`)
        .then(res => res.json())
        .then(updatedMovie => {
          setMovie(updatedMovie);
          if(onUpdateRating) onUpdateRating(updatedMovie.average_rating);
        });

      showToast("แสดงความคิดเห็นเรียบร้อย!", "success");
    })
    .catch(err => {
      console.error("ไม่สามารถโพสต์คอมเมนต์:", err);
      showToast("ไม่สามารถส่งคอมเมนต์ได้", "error");
    });
  };

  const renderAverageStars = (rating) => {
    const stars = [];
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const decimal = numRating - fullStars;
    const halfStars = decimal >= 0.25 && decimal < 0.75 ? 1 : 0;
    const extraFull = decimal >= 0.75 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStars - extraFull;

    for (let i = 0; i < fullStars + extraFull; i++)
      stars.push(<Ionicons key={`full-${i}`} name="star" size={18} color="#FFD700" />);
    for (let i = 0; i < halfStars; i++)
      stars.push(<Ionicons key={`half-${i}`} name="star-half" size={18} color="#FFD700" />);
    for (let i = 0; i < emptyStars; i++)
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={18} color="#FFD700" />);

    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    const status = await videoRef.current.getStatusAsync();
    if (status.isPlaying) { await videoRef.current.pauseAsync(); setIsPlaying(false); }
    else { await videoRef.current.playAsync(); setIsPlaying(true); }
  };

  const enterFullScreen = async () => { 
    try { 
      if(videoRef.current) await videoRef.current.presentFullscreenPlayer(); 
    } catch(err){ console.error(err); }
  };

  if (loading || !movie)
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#e50914" />
          <Text style={styles.backText}>กลับ</Text>
        </TouchableOpacity>

        {/* Poster */}
        <Image
          source={{ uri: `${BASE_URL}/posters/${movie.poster}` }}
          style={{ width: screenWidth, height: screenWidth * 1.5, borderRadius: 12 }}
          resizeMode="cover"
        />

        <View style={{ marginVertical: 15, paddingHorizontal: 10 }}>
          <Text style={styles.posterTitle}>{movie.title}</Text>
          <Text style={styles.descriptionText}>{movie.description || "ไม่มีรายละเอียด"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
            {renderAverageStars(movie.average_rating)}
            <Text style={styles.avgRatingText}>
              {" "}({movie.average_rating !== null ? Number(movie.average_rating).toFixed(1) : "0.0"} / 5.0)
            </Text>
          </View>
        </View>

        {/* Video */}
        <View style={styles.videoContainer}>
          {user.type === "guest" ? (
            <View style={[styles.video, { justifyContent: "center", alignItems: "center", backgroundColor: "#222" }]}>
              <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
                วิดีโอดูได้เฉพาะสมาชิก
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={{ marginTop: 10, paddingVertical: 8, paddingHorizontal: 15, backgroundColor: "#e50914", borderRadius: 6 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Login / สมัครสมาชิก</Text>
              </TouchableOpacity>
            </View>
          ) : !videoError ? (
            <View>
              <Video
                ref={videoRef}
                source={{ uri: `${BASE_URL}/videos/${movie.video}` }}
                useNativeControls={false}
                resizeMode="contain"
                style={styles.video}
                onError={() => setVideoError(true)}
              />
              {showControls && (
                <View style={styles.videoControls} pointerEvents="box-none">
                  <TouchableOpacity onPress={togglePlay} style={styles.centerButton} activeOpacity={0.8}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={50} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={enterFullScreen} style={[styles.fullscreenButton, { zIndex: 10 }]} activeOpacity={0.8}>
                    <Ionicons name="expand" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.video, { justifyContent: "center", alignItems: "center", backgroundColor: "#222" }]}>
              <Text style={{ color: "#fff" }}>ไม่สามารถโหลดวิดีโอได้</Text>
            </View>
          )}
        </View>

        {/* Comments */}
        <Text style={styles.sectionTitle}>ความคิดเห็นทั้งหมด</Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Image source={{ uri: `${BASE_URL}/uploads/profile/${item.profilePicture}` }} style={styles.commentAvatar} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.commentUser}>{item.firstname} {item.lastname}</Text>
                {renderAverageStars(Number(item.rating) || 0)}
                <Text style={styles.commentText}>{item.comment}</Text>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />

        {/* Add comment */}
        <Text style={styles.sectionTitle}>แสดงความคิดเห็น</Text>
        <TextInput
          placeholder="เขียนความคิดเห็น..."
          placeholderTextColor="#777"
          value={commentText}
          onChangeText={setCommentText}
          style={styles.input}
        />
        <View style={styles.starInput}>
          {[1,2,3,4,5].map(i => (
            <TouchableOpacity key={i} onPress={() => setCommentRating(i)} activeOpacity={0.7}>
              <Ionicons name={i <= commentRating ? "star" : "star-outline"} size={28} color="#FFD700" />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={submitComment}>
          <Text style={styles.buttonText}>แสดงความคิดเห็น</Text>
        </TouchableOpacity>
      </ScrollView>

      {toastMsg && <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 10 },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { color: "#e50914", fontSize: 18, marginLeft: 5, fontWeight: "700" },
  posterTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 5 },
  descriptionText: { color: "#ccc", fontSize: 16, marginTop: 5 },
  avgRatingText: { color: "#FFD700", fontWeight: "700", marginLeft: 5 },
  videoContainer: { marginBottom: 20, borderWidth: 2, borderColor: "#e50914", borderRadius: 12, overflow: "hidden" },
  video: { width: "100%", aspectRatio: 16/9, backgroundColor: "#000" },
  videoControls: { position: "absolute", top:0,left:0,right:0,bottom:0,justifyContent:"center",alignItems:"center" },
  centerButton: { backgroundColor:"rgba(0,0,0,0.5)", padding:20, borderRadius:50 },
  fullscreenButton: { position:"absolute", bottom:10,right:10, backgroundColor:"rgba(0,0,0,0.5)", padding:6,borderRadius:8 },
  sectionTitle: { color:"#fff", fontSize:18, fontWeight:"700", marginTop:20, marginBottom:10 },
  commentItem: { flexDirection:"row", backgroundColor:"#111", padding:10, borderRadius:8, marginBottom:8, alignItems:"flex-start" },
  commentAvatar: { width:40, height:40, borderRadius:20, borderWidth:1, borderColor:"#e50914", backgroundColor:"#333" },
  commentUser: { color:"#FFD700", fontWeight:"700" },
  commentText: { color:"#fff" },
  input: { backgroundColor:"#222", color:"#fff", borderRadius:8, paddingHorizontal:10, height:40, marginBottom:5 },
  starInput: { flexDirection:"row", marginBottom:10 },
  button: { backgroundColor:"#e50914", padding:10, borderRadius:8, alignItems:"center", marginBottom:15 },
  buttonText: { color:"#fff", fontWeight:"700" },
});
