
const express = require("express");
const crypto = require("crypto");
const QRCode = require("qrcode");
const pool = require("../db/pool");

const router = express.Router();

// สร้าง Base URL สำหรับ Short URL
function getBaseUrl(req) {
  return (
    process.env.BASE_URL ||
    `${req.protocol}://${req.get("host")}`
  ).replace(/\/+$/, "");
}

// ==========================================
// 1. สร้าง Short URL
// POST /api/urls
// ==========================================
router.post("/api/urls", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    // ตรวจสอบข้อมูล
    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุ URL"
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(originalUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: "รูปแบบ URL ไม่ถูกต้อง"
      });
    }

    // รองรับเฉพาะ HTTP และ HTTPS
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: "รองรับเฉพาะ HTTP และ HTTPS"
      });
    }

    // สร้างรหัสสั้นแบบสุ่ม
    const shortCode = crypto
      .randomBytes(4)
      .toString("hex");

    // บันทึกลง PostgreSQL
    const result = await pool.query(
      `INSERT INTO urls
        (original_url, short_code)
       VALUES ($1, $2)
       RETURNING
         id,
         original_url,
         short_code,
         click_count,
         created_at`,
      [parsedUrl.toString(), shortCode]
    );

    const url = result.rows[0];
    const baseUrl = getBaseUrl(req);

    return res.status(201).json({
      success: true,
      message: "สร้าง Short URL สำเร็จ",
      data: {
        id: url.id,
        originalUrl: url.original_url,
        shortCode: url.short_code,
        shortUrl: `${baseUrl}/${url.short_code}`,
        clickCount: url.click_count,
        createdAt: url.created_at
      }
    });

  } catch (error) {
    console.error("Create URL error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้าง Short URL"
    });
  }
});

// ==========================================
// 2. ดูประวัติ Short URL ทั้งหมด
// GET /api/urls
// ==========================================
router.get("/api/urls", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        original_url,
        short_code,
        click_count,
        created_at,
        updated_at
      FROM urls
      ORDER BY created_at DESC
    `);

    const baseUrl = getBaseUrl(req);

    const urls = result.rows.map((url) => ({
      ...url,
      shortUrl: `${baseUrl}/${url.short_code}`
    }));

    return res.json({
      success: true,
      total: urls.length,
      data: urls
    });

  } catch (error) {
    console.error("Get URLs error:", error);

    return res.status(500).json({
      success: false,
      message: "ไม่สามารถดึงประวัติ URL ได้"
    });
  }
});

// ==========================================
// 3. ดูสถิติการคลิกของ URL
// GET /api/urls/:id/stats
// ==========================================
router.get("/api/urls/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบ ID
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "ID ไม่ถูกต้อง"
      });
    }

    // ค้นหา URL
    const urlResult = await pool.query(
      `SELECT
         id,
         original_url,
         short_code,
         click_count,
         created_at
       FROM urls
       WHERE id = $1`,
      [id]
    );

    if (urlResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ URL นี้"
      });
    }

    // สถิติคลิกรายวัน
    const statsResult = await pool.query(
      `SELECT
         DATE(clicked_at) AS date,
         COUNT(*)::int AS clicks
       FROM clicks
       WHERE url_id = $1
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC`,
      [id]
    );

    const url = urlResult.rows[0];

    return res.json({
      success: true,
      data: {
        url,
        totalClicks: url.click_count,
        dailyStats: statsResult.rows
      }
    });

  } catch (error) {
    console.error("Stats error:", error);

    return res.status(500).json({
      success: false,
      message: "ไม่สามารถดึงสถิติได้"
    });
  }
});

// ==========================================
// 4. สร้าง QR Code
// GET /api/urls/:id/qr
// ==========================================
router.get("/api/urls/:id/qr", async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบ ID
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "ID ไม่ถูกต้อง"
      });
    }

    // ค้นหา Short Code
    const result = await pool.query(
      `SELECT short_code
       FROM urls
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ URL นี้"
      });
    }

    const baseUrl = getBaseUrl(req);
    const shortUrl =
      `${baseUrl}/${result.rows[0].short_code}`;

    // สร้าง QR Code
    const qrCode = await QRCode.toDataURL(shortUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: "M"
    });

    return res.json({
      success: true,
      data: {
        shortUrl,
        qrCode
      }
    });

  } catch (error) {
    console.error("QR Code error:", error);

    return res.status(500).json({
      success: false,
      message: "ไม่สามารถสร้าง QR Code ได้"
    });
  }
});

// ==========================================
// 5. Redirect และบันทึกสถิติการคลิก
// GET /:shortCode
// ==========================================
router.get("/:shortCode", async (req, res) => {
  const { shortCode } = req.params;
  let client;

  try {
    // เชื่อมต่อ Database
    client = await pool.connect();

    await client.query("BEGIN");

    // ค้นหา Short URL
    const result = await client.query(
      `SELECT
         id,
         original_url
       FROM urls
       WHERE short_code = $1`,
      [shortCode]
    );

    // ไม่พบ Short URL
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "ไม่พบ Short URL นี้"
      });
    }

    const url = result.rows[0];

    // เพิ่มจำนวนคลิก
    await client.query(
      `UPDATE urls
       SET
         click_count = click_count + 1,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [url.id]
    );

    // บันทึกประวัติการคลิก
    await client.query(
      `INSERT INTO clicks
         (url_id, ip_address, user_agent)
       VALUES ($1, $2, $3)`,
      [
        url.id,
        req.ip,
        req.get("user-agent") || null
      ]
    );

    // ยืนยัน Transaction
    await client.query("COMMIT");

    // Redirect ไปเว็บไซต์ต้นฉบับ
    return res.redirect(302, url.original_url);

  } catch (error) {
    // ยกเลิก Transaction หากเกิดข้อผิดพลาด
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    console.error("Redirect error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการ Redirect"
    });

  } finally {
    // คืน Database Connection
    if (client) {
      client.release();
    }
  }
});

// ==========================================
// ส่งออก Router
// ==========================================
module.exports = router;