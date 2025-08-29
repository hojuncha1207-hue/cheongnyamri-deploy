// backend/server.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Neon DB 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// API: 주문 정보 저장
app.post('/api/orders', async (req, res) => {
  // 프론트엔드에서 보낸 3가지 핵심 데이터
  const { orderId, userId, cart } = req.body;

  try {
    // DB에 데이터 저장
    await pool.query(
      'INSERT INTO orders (order_id, user_id, order_details) VALUES ($1, $2, $3)',
      [orderId, userId, { cart }] // cart가 주문 목록에 해당
    );
    res.status(201).json({ message: 'Order created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database insertion failed' });
  }
});

// API: 사용자 ID로 주문 정보 조회
app.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.listen(port, () => {
  console.log(`Server is ready and listening on port ${port}`);
});