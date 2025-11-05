const db = require("../db");
const bcrypt = require("bcrypt");

// Register
exports.register = async (req, res) => {
  const { email, password, first_name, last_name, profile, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (email, password, first_name, last_name, profile, role) VALUES (?, ?, ?, ?, ?, ?)",
      [email, hashedPassword, first_name, last_name, profile || null, role || "user"],
      (err, result) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "User registered!" });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.login = (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile: user.profile,
      role: user.role,
    });
  });
};
