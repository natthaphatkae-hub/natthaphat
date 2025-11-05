import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config";

// Custom Dropdown Component
const CategoryDropdown = ({ categories, selectedCategory, setSelectedCategory }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: 15 }}>
      <TouchableOpacity
        style={[styles.dropdownButton, { borderColor: "#e50914" }]}
        onPress={() => setOpen(!open)}
      >
        <Text style={styles.dropdownText}>
          {selectedCategory || "เลือกหมวดหมู่"}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selectedCategory === item && styles.optionActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCategory === item && styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function AddMovieScreen({ route, navigation }) {
  const movie = route.params?.movie || null;
  const categories = ["โรแมนติก", "ดราม่า", "ตลก", "สยองขวัญ", "แอคชั่น"];

  const [title, setTitle] = useState(movie?.title || "");
  const [category, setCategory] = useState(movie?.category || "");
  const [description, setDescription] = useState(movie?.description || "");
  const [posterFile, setPosterFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("error");

  const showToast = (msg, type = "error") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    if (movie) {
      if (movie.poster) {
        setPosterFile({
          uri: `${BASE_URL}/posters/${movie.poster}`,
          name: movie.poster,
          type: movie.poster.endsWith(".png") ? "image/png" : "image/jpeg",
        });
      }
      if (movie.video) {
        const videoUri = `${BASE_URL}/videos/${movie.video}`;
        setVideoFile({ uri: videoUri, name: movie.video, mimeType: "video/mp4" });
        (async () => {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1000 });
            setVideoThumbnail(uri);
          } catch (e) {
            console.log("❌ Error creating thumbnail:", e);
          }
        })();
      }
    }
  }, [movie]);

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("ไม่สามารถเข้าถึงรูปภาพได้");
      return false;
    }
    return true;
  };

  const pickPoster = async () => {
    try {
      const ok = await requestMediaLibraryPermission();
      if (!ok) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });
      if (!result.canceled) setPosterFile(result.assets[0]);
    } catch (err) {
      console.log("❌ pickPoster Error:", err);
      showToast("ไม่สามารถเลือกภาพได้");
    }
  };

  const getVideoUri = async (uri, name) => {
    if (Platform.OS === "android" && uri.startsWith("content://")) {
      const dest = `${FileSystem.cacheDirectory}${name || `video_${Date.now()}.mp4`}`;
      const fileInfo = await FileSystem.getInfoAsync(dest);
      if (fileInfo.exists) await FileSystem.deleteAsync(dest);
      await FileSystem.copyAsync({ from: uri, to: dest });
      return dest;
    }
    return uri;
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "video/*", copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoAsset = result.assets[0];
        const videoUri = await getVideoUri(videoAsset.uri, videoAsset.name);
        setVideoFile({ ...videoAsset, uri: videoUri });
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1000 });
          setVideoThumbnail(uri);
        } catch (e) {
          console.log("❌ Error creating thumbnail:", e);
          showToast("ไม่สามารถสร้าง thumbnail ของวิดีโอได้");
        }
      }
    } catch (err) {
      console.log("❌ pickVideo Error:", err);
      showToast("ไม่สามารถเลือกวิดีโอได้");
    }
  };

  const handleSubmit = async () => {
    if (!title || !category || !description) {
      showToast("กรุณากรอกข้อมูลครบ");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);

    if (posterFile && posterFile.uri.startsWith("file://")) {
      const filename = posterFile.uri.split("/").pop();
      const type = filename.endsWith(".png") ? "image/png" : "image/jpeg";
      formData.append("poster", { uri: posterFile.uri, name: filename, type });
    }

    if (videoFile && videoFile.uri.startsWith("file://")) {
      const videoName = videoFile.name || `video_${Date.now()}.mp4`;
      const videoType = videoName.endsWith(".mov") ? "video/quicktime" : "video/mp4";
      formData.append("video", { uri: videoFile.uri, name: videoName, type: videoType });
    }

    try {
      const url = movie ? `${BASE_URL}/movies/${movie.id}` : `${BASE_URL}/movies`;
      const method = movie ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData, headers: { "Content-Type": "multipart/form-data" } });
      const data = await res.json();

      if (res.ok) {
        showToast(movie ? "แก้ไขหนังเรียบร้อย" : "เพิ่มหนังเรียบร้อย", "success");
        if (!movie) {
          setTitle(""); setCategory(""); setDescription("");
          setPosterFile(null); setVideoFile(null); setVideoThumbnail(null);
        }
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showToast(data.error || "ไม่สามารถบันทึกหนังได้");
      }
    } catch (err) {
      console.log("❌ ERROR while uploading:", err);
      showToast("ไม่สามารถเชื่อมต่อ server");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.header}>{movie ? "แก้ไขหนัง" : "เพิ่มหนัง"}</Text>

      <Text style={[styles.label, { borderColor: "#e50914" }]}>ชื่อหนัง</Text>
      <TextInput
        placeholder="ชื่อหนัง"
        placeholderTextColor="#aaa"
        value={title}
        onChangeText={setTitle}
        style={[styles.input, { borderColor: "#e50914", borderWidth: 2 }]}
      />

      <Text style={[styles.label, { borderColor: "#e50914" }]}>หมวดหมู่</Text>
      <CategoryDropdown
        categories={categories}
        selectedCategory={category}
        setSelectedCategory={setCategory}
      />

      <Text style={[styles.label, { borderColor: "#e50914" }]}>คำอธิบาย</Text>
      <TextInput
        placeholder="คำอธิบาย"
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { borderColor: "#e50914", borderWidth: 2, height: 100 }]}
        multiline
      />

      <Text style={styles.centerLabel}>โปสเตอร์</Text>
      <TouchableOpacity onPress={pickPoster} style={[styles.posterContainer, { borderColor: "#e50914", borderWidth: 2 }]}>
        {posterFile ? (
          <Image source={{ uri: posterFile.uri }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="image-outline" size={40} color="#aaa" />
            <Text style={styles.fileText}>เลือกรูปโปสเตอร์</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.centerLabel}>วิดีโอ</Text>
      <TouchableOpacity onPress={pickVideo} style={[styles.posterContainer, { borderColor: "#e50914", borderWidth: 2 }]}>
        {videoThumbnail ? (
          <View style={styles.poster}>
            <Image
              source={{ uri: videoThumbnail }}
              style={{ width: "100%", height: "100%", borderRadius: 12 }}
            />
            <Ionicons
              name="videocam-outline"
              size={40}
              color="#fff"
              style={{ position: "absolute", top: 10, left: 10 }}
            />
            <Text
              style={[styles.fileText, { position: "absolute", bottom: 5, width: "90%" }]}
              numberOfLines={1}
            >
              {videoFile?.name}
            </Text>
          </View>
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="videocam-outline" size={40} color="#aaa" />
            <Text style={styles.fileText}>เลือกวิดีโอ</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>บันทึก</Text>
      </TouchableOpacity>

      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: toastType === "success" ? "#28a745" : "#e50914" }]}>
          <Text style={{ color: "#fff" }}>{toastMsg}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16, paddingBottom: 40, backgroundColor: "#000" },
  header: { fontSize: 26, fontWeight: "bold", color: "#fff", textAlign: "left", marginBottom: 20 },
  label: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 5 },
  centerLabel: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  input: { backgroundColor: "#111", color: "#fff", borderRadius: 12, padding: 12, marginBottom: 15 },
  posterContainer: { alignItems: "center", marginBottom: 15, borderRadius: 12, overflow: "hidden" },
  poster: { width: 150, height: 200, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  posterPlaceholder: { justifyContent: "center", alignItems: "center", backgroundColor: "#333" },
  fileText: { color: "#fff", marginTop: 5, textAlign: "center", fontSize: 14 },
  button: { 
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    alignSelf: "center"
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
  toast: { position: "absolute", top: 20, left: 20, right: 20, padding: 10, borderRadius: 8, alignItems: "center" },

  // Dropdown Styles
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#e50914",
  },
  dropdownText: { color: "#fff", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: "#111",
    borderRadius: 12,
    maxHeight: 250,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  optionActive: { backgroundColor: "#e50914" },
  optionText: { color: "#fff", fontSize: 16 },
  optionTextActive: { fontWeight: "700" },
});
