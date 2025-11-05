// helpers/notificationHelper.js
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ตั้งค่าให้แสดงแจ้งเตือนในขณะเปิดแอปได้
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ✅ ขอสิทธิ์แจ้งเตือน
export async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      alert("ไม่ได้รับอนุญาตให้แสดงการแจ้งเตือน");
      return false;
    }
  }

  // Android ต้องตั้งค่า channel สำหรับแจ้งเตือน
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return true;
}

// ✅ ฟังก์ชันแสดง Notification
export async function sendLocalNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // แสดงทันที
  });
}
