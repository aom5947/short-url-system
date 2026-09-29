const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const urlRoutes = require("./routes/urlRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// อนุญาตให้ Frontend เรียก API
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// อ่าน JSON จาก Request
app.use(express.json());

// เรียกใช้งาน URL Routes
app.use("/", urlRoutes);

// ทดสอบ Server
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "URL Shortener API is running",
  });
});

// เริ่มต้น Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});