// index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- โฟลเดอร์เก็บไฟล์ -------------------
const profileFolder = path.join(__dirname, "uploads/profile");
const posterFolder = path.join(__dirname, "uploads/posters");
const videoFolder = path.join(__dirname, "uploads/videos");

[profileFolder, posterFolder, videoFolder].forEach(f => {
  if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true });
});

// ------------------- Multer Storage -------------------
const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileFolder),
  filename: (req, file, cb) => {
    const name = file.originalname || `profile_${Date.now()}.jpg`;
    cb(null, Date.now() + "_" + name);
  },
});

const storageMovieFiles = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "poster") cb(null, posterFolder);
    else if (file.fieldname === "video") cb(null, videoFolder);
    else cb(null, posterFolder);
  },
  filename: (req, file, cb) => {
    const name = file.originalname || `file_${Date.now()}.mp4`;
    cb(null, Date.now() + "_" + name);
  },
});

const uploadProfile = multer({ storage: storageProfile });
const uploadMovieFiles = multer({ storage: storageMovieFiles }).fields([
  { name: "poster", maxCount: 1 },
  { name: "video", maxCount: 1 }
]);

// ------------------- Serve Static -------------------
app.use('/posters', express.static(posterFolder));
app.use('/videos', express.static(videoFolder));
app.use('/uploads/profile', express.static(profileFolder));

// ------------------- MySQL Connection -------------------
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "mydb",
}).promise(); // ใช้ async/await

// ------------------- Nodemailer (Ethereal) -------------------
let transporter;

nodemailer.createTestAccount()
  .then(testAccount => {
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

  })
  .catch(console.error);

// ------------------- OTP Store -------------------
let otpStore = {}; 
// { email: { otp: "123456", expiresAt: timestamp } }

// ------------------- Users -------------------
// Register
app.post("/register", uploadProfile.single("profile"), async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!first_name || !last_name || !email || !password)
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });

  try {
    const [existing] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "อีเมลนี้ถูกใช้แล้ว" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePath = req.file ? req.file.filename : "default.png";
    const role = "user";
    const [result] = await db.execute(
      "INSERT INTO users (first_name, last_name, email, password, profile, role) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name, last_name, email, hashedPassword, profilePath, role]
    );
    res.status(200).json({ message: "สมัครสมาชิกสำเร็จ", userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด server" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (results.length === 0) return res.status(401).json({ error: "ไม่พบผู้ใช้" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });

    res.json({
      userId: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      profile: user.profile,
      role: user.role || "user",
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด server" });
  }
});

// ------------------- Forgot Password -------------------
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "กรุณากรอกอีเมล" });

  try {
    const [users] = await db.execute("SELECT * FROM users WHERE email=?", [email]);
    if (users.length === 0) return res.status(404).json({ error: "ไม่พบอีเมลนี้" });

    // สร้าง OTP 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // หมดอายุ 5 นาที
    otpStore[email] = { otp, expiresAt };

    if (!transporter) return res.status(500).json({ error: "Mailer ยังไม่พร้อม" });

    const info = await transporter.sendMail({
      from: '"Movie App" <no-reply@example.com>',
      to: email,
      subject: "OTP สำหรับรีเซ็ตรหัสผ่าน",
      text: `รหัส OTP ของคุณคือ: ${otp} (ใช้ได้ภายใน 5 นาที)`,
    });

    console.log("ส่ง OTP สำเร็จ:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));

    // ส่ง OTP กลับมาพร้อม message สำหรับทดสอบบนมือถือ
    res.json({ 
      message: "ส่ง OTP ไปยังอีเมลเรียบร้อย", 
      otp, // ส่ง OTP ให้แอพ Expo
      preview: nodemailer.getTestMessageUrl(info)
    });

  } catch (err) {
    console.error("Error forgot-password:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด server" });
  }
});


// ------------------- Reset Password -------------------
app.post("/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ error: "OTP ไม่ถูกต้องหรือหมดอายุ" });

  if (record.otp !== otp) return res.status(400).json({ error: "OTP ไม่ถูกต้อง" });
  if (record.expiresAt < Date.now()) return res.status(400).json({ error: "OTP หมดอายุ" });

  if (newPassword.length < 6)
    return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password=? WHERE email=?", [hashedPassword, email]);

    delete otpStore[email];
    res.status(200).json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถเปลี่ยนรหัสผ่านได้" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const [results] = await db.execute(
      "SELECT id AS userId, first_name, last_name, email, profile FROM users WHERE role='user' ORDER BY id ASC"
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดดึงผู้ใช้" });
  }
});

// Update user
app.put("/users/:id", uploadProfile.single("profile"), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, newPassword } = req.body;
  if (!first_name || !last_name || !email)
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลครบ" });

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE id=?", [id]);
    if (results.length === 0) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });

    const user = results[0];
    let hashedPassword = user.password;
    if (newPassword) hashedPassword = await bcrypt.hash(newPassword, 10);

    let profilePath = user.profile;
    if (req.file) {
      profilePath = req.file.filename;
      if (user.profile && user.profile !== "default.png") {
        const oldFile = path.join(profileFolder, user.profile);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    }

    await db.execute(
      "UPDATE users SET first_name=?, last_name=?, email=?, password=?, profile=? WHERE id=?",
      [first_name, last_name, email, hashedPassword, profilePath, id]
    );
    res.json({ success: true, profile: profilePath, first_name, last_name, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด server" });
  }
});

// Delete user
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.execute("SELECT profile FROM users WHERE id=?", [id]);
    if (results.length > 0 && results[0].profile && results[0].profile !== "default.png") {
      const oldFile = path.join(profileFolder, results[0].profile);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
    await db.execute("DELETE FROM users WHERE id=?", [id]);
    res.json({ message: "ลบผู้ใช้เรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถลบผู้ใช้" });
  }
});

// ------------------- Movies -------------------
app.get("/movies", async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM movies ORDER BY average_rating DESC");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดดึงหนัง" });
  }
});

app.get("/movies/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [results] = await db.execute("SELECT * FROM movies WHERE id=?", [id]);
    if (results.length === 0) return res.status(404).json({ error: "ไม่พบหนัง" });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดดึงหนัง" });
  }
});

app.post("/movies", uploadMovieFiles, async (req, res) => {
  console.log("FILES RECEIVED:", req.files);
  const { title, description, category } = req.body;
  if (!title || !description || !category) return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

  const poster = req.files?.poster?.[0]?.filename || null;
  const video = req.files?.video?.[0]?.filename || null;

  try {
    const [result] = await db.execute(
      "INSERT INTO movies (title, description, category, poster, video) VALUES (?, ?, ?, ?, ?)",
      [title, description, category, poster, video]
    );
    res.json({ message: "เพิ่มหนังเรียบร้อย", movieId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถบันทึกหนังได้" });
  }
});

app.put("/movies/:id", uploadMovieFiles, async (req, res) => {
  const { id } = req.params;
  const { title, description, category } = req.body;

  try {
    const [results] = await db.execute("SELECT * FROM movies WHERE id=?", [id]);
    if (results.length === 0) return res.status(404).json({ error: "ไม่พบหนัง" });

    const movie = results[0];
    let poster = movie.poster;
    let video = movie.video;

    if (req.files?.poster) {
      poster = req.files.poster[0].filename;
      if (movie.poster) {
        const oldPoster = path.join(posterFolder, movie.poster);
        if (fs.existsSync(oldPoster)) fs.unlinkSync(oldPoster);
      }
    }

    if (req.files?.video) {
      video = req.files.video[0].filename;
      if (movie.video) {
        const oldVideo = path.join(videoFolder, movie.video);
        if (fs.existsSync(oldVideo)) fs.unlinkSync(oldVideo);
      }
    }

    await db.execute(
      "UPDATE movies SET title=?, description=?, category=?, poster=?, video=? WHERE id=?",
      [title, description, category, poster, video, id]
    );
    res.json({ message: "แก้ไขหนังเรียบร้อย", poster, video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถแก้ไขหนังได้" });
  }
});

app.delete("/movies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.execute("SELECT poster, video FROM movies WHERE id=?", [id]);
    if (results.length === 0) return res.status(404).json({ error: "ไม่พบหนัง" });

    if (results[0].poster) {
      const posterPath = path.join(posterFolder, results[0].poster);
      if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
    }
    if (results[0].video) {
      const videoPath = path.join(videoFolder, results[0].video);
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    }

    await db.execute("DELETE FROM movies WHERE id=?", [id]);
    res.json({ message: "ลบหนังเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถลบหนังได้" });
  }
});

// ------------------- Comments -------------------
// GET comments
app.get("/comments/:movieId", async (req, res) => {
  const movieId = req.params.movieId;
  try {
    const [results] = await db.execute(
      `SELECT c.*, u.first_name AS firstname, u.last_name AS lastname, u.profile AS profilePicture
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.movie_id = ? ORDER BY c.id DESC`, [movieId]
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching comments" });
  }
});

// POST comment
app.post("/comments", async (req, res) => {
  const { movie_id, user_id, comment, rating } = req.body;
  if (!movie_id || !user_id || !comment || !rating)
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

  try {
    const [result] = await db.execute(
      "INSERT INTO comments (movie_id, user_id, comment, rating) VALUES (?, ?, ?, ?)",
      [movie_id, user_id, comment, rating]
    );

    // อัปเดต average_rating
    await db.execute(
      "UPDATE movies SET average_rating = (SELECT AVG(rating) FROM comments WHERE movie_id=?) WHERE id=?",
      [movie_id, movie_id]
    );

    res.json({ message: "บันทึกคอมเมนต์เรียบร้อย", commentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถบันทึกคอมเมนต์ได้" });
  }
});


// ------------------- History -------------------
app.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT h.id, h.movie_id, h.viewed_at, m.title, m.poster
       FROM history h
       JOIN movies m ON h.movie_id = m.id
       WHERE h.user_id=? ORDER BY h.viewed_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดดึงประวัติ" });
  }
});

app.post("/history", async (req, res) => {
  const { userId, movieId } = req.body;
  if (!userId || !movieId) return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

  try {
    const [existing] = await db.execute(
      `SELECT id FROM history WHERE user_id=? AND movie_id=?`,
      [userId, movieId]
    );

    if (existing.length > 0) {
      await db.execute(`UPDATE history SET viewed_at=NOW() WHERE id=?`, [existing[0].id]);
      res.json({ message: "อัปเดตประวัติเรียบร้อย" });
    } else {
      await db.execute(
        `INSERT INTO history (user_id, movie_id, viewed_at) VALUES (?, ?, NOW())`,
        [userId, movieId]
      );
      res.json({ message: "เพิ่มประวัติเรียบร้อย" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดเพิ่ม/อัปเดตประวัติ" });
  }
});

app.delete("/history/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM history WHERE id=?`, [id]);
    res.json({ message: "ลบประวัติเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดลบประวัติ" });
  }
});

app.delete("/history/all/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await db.execute(`DELETE FROM history WHERE user_id=?`, [userId]);
    res.json({ message: "ลบประวัติทั้งหมดเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดลบประวัติทั้งหมด" });
  }
});

// ------------------- Update Profile -------------------
app.post("/updateProfile", uploadProfile.single("profile"), async (req, res) => {
  const { id, first_name, last_name, oldPassword, newPassword } = req.body;
  if (!id || !first_name || !last_name) return res.json({ success: false, message: "กรุณากรอกข้อมูลครบ" });

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE id=?", [id]);
    if (results.length === 0) return res.json({ success: false, message: "ไม่พบผู้ใช้" });

    const user = results[0];
    if (oldPassword && !(await bcrypt.compare(oldPassword, user.password))) {
      return res.json({ success: false, message: "รหัสผ่านเดิมไม่ถูกต้อง" });
    }

    let hashedPassword = user.password;
    if (newPassword) hashedPassword = await bcrypt.hash(newPassword, 10);

    let profilePath = user.profile;
    if (req.file) {
      profilePath = req.file.filename;
      if (user.profile && user.profile !== "default.png") {
        const oldFile = path.join(profileFolder, user.profile);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    }

    await db.execute(
      "UPDATE users SET first_name=?, last_name=?, password=?, profile=? WHERE id=?",
      [first_name, last_name, hashedPassword, profilePath, id]
    );
    res.json({ success: true, profile: profilePath, first_name, last_name });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "เกิดข้อผิดพลาดบันทึกข้อมูล" });
  }
});

// ------------------- Run Server -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
