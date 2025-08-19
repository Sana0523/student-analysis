import mysql2 from 'mysql2/promise';
 const pool= mysql2.createPool({
  host:'localhost',
  user: 'user_name',
  password: 'password',
  database: 'student_data',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
 });