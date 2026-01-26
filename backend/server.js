// Import library yang dibutuhkan
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Inisialisasi aplikasi Express
const app = express();
const port = 3000;

// Middleware untuk mengizinkan request dari domain lain (frontend Anda)
app.use(cors());
// Middleware untuk parsing body request sebagai JSON
app.use(express.json());

// --- KONEKSI DATABASE ---
// Ganti dengan kredensial database PostgreSQL Anda!
// Anda bisa menggunakan layanan seperti Supabase atau ElephantSQL untuk mendapatkan database gratis.
const pool = new Pool({
  user: 'postgres',
  host: 'db.mrhpghbhkccuodwncvkl.supabase.co',
  database: 'postgres',
  password: '2008Raiirsyad//', // INGAT: Anda harus MENGGANTI 'your_password' dengan password Supabase Anda yang sebenarnya!
  port: 5432,
});

// --- API ENDPOINTS ---

/**
 * @api {get} /products Mendapatkan semua data produk
 * @apiName GetProducts
 * @apiGroup Product
 *
 * @apiSuccess {Object[]} products List produk.
 * @apiSuccess {Number} products.id ID produk.
 * @apiSuccess {String} products.name Nama produk.
 * @apiSuccess {Number} products.price Harga produk.
 * @apiSuccess {String} products.image_url URL gambar produk.
 * @apiSuccess {String} products.description Deskripsi produk.
 */
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {post} /products Menambahkan produk baru
 * @apiName CreateProduct
 * @apiGroup Product
 *
 * @apiBody {String} name Nama produk.
 * @apiBody {Number} price Harga produk.
 * @apiBody {String} image_url URL gambar produk.
 * @apiBody {String} description Deskripsi produk.
 *
 * @apiSuccess {Object} product Produk yang baru dibuat.
 */
app.post('/products', async (req, res) => {
  try {
    const { name, price, image_url, description } = req.body;

    // Validasi input
    if (!name || !price || !image_url || !description) {
      return res.status(400).json({ error: 'Semua field harus diisi: name, price, image_url, description.' });
    }

    const newProduct = await pool.query(
      'INSERT INTO products (name, price, image_url, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, image_url, description]
    );

    res.status(201).json(newProduct.rows[0]);
  } catch (error)
    {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
