// Shared MySQL connection pool. Every module imports this:
//   const db = require('../db');
//   const [rows] = await db.query('SELECT * FROM spots WHERE id = ?', [id]);
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lighthunt',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

module.exports = pool;
