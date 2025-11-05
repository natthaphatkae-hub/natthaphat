// screens/AdminDashboard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      <TouchableOpacity
        style={styles.cardButton}
        onPress={() => navigation.navigate("AdminMovies")}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>จัดการหนัง</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cardButton}
        onPress={() => navigation.navigate("AdminUsers")}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>จัดการสมาชิก</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#121212", 
    padding: 20 
  },
  header: { 
    fontSize: 32, 
    color: "#e50914", 
    fontWeight: "900", 
    marginBottom: 50, 
    textAlign: "center" 
  },
  cardButton: {
    width: width * 0.85,
    backgroundColor: "#e50914",
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
});
