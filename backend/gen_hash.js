// gen_hash.js
const bcrypt = require("bcrypt");

(async () => {
  const password = "123456"; // รหัสที่คุณอยากใช้
  const hash = await bcrypt.hash(password, 10); // 10 = salt rounds
  console.log("Hash:", hash);
})();
