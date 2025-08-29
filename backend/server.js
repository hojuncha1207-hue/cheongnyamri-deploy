// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Neon DB 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render에 환경변수로 설정
  ssl: { rejectUnauthorized: false }
});

// ✅ 주문 생성 API
app.post("/orders", async (req, res) => {
  try {
    const { userId, items } = req.body;

    // 주문번호 생성
    const orderNumber = uuidv4().split("-")[0]; // 짧게 사용
    // QR 코드 생성 (Base64 Data URL)
    const qrCodeDataUrl = await QRCode.toDataURL(orderNumber);

    // DB 저장
    const result = await pool.query(
      `INSERT INTO orders (user_id, order_number, items, qr_code_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, orderNumber, JSON.stringify(items), qrCodeDataUrl]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "주문 저장 실패" });
  }
});

// ✅ 특정 주문 조회
app.get("/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "주문 조회 실패" });
  }
});

// ✅ 특정 사용자 주문 내역 조회
app.get("/orders/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "사용자 주문 조회 실패" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
