require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_jwt_secret_key'; // Use a strong, random key in production!

// File paths for data storage
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// Helper functions for reading/writing user data
const readUsers = () => {
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
};

const writeUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create 'uploads' directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Serve static uploaded files
app.use('/uploads', express.static(uploadsDir));

// Basic route
app.get('/', (req, res) => {
    res.send('SEKITAR Backend Server is running!');
});

// User Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = readUsers();
    if (users.find(user => user.username === username)) {
        return res.status(409).json({ message: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), username, password: hashedPassword };
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ message: 'User registered successfully.' });
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// File paths for image data storage
const imagesFilePath = path.join(__dirname, 'data', 'images.json');

// Helper functions for reading/writing image data
const readImages = () => {
    if (!fs.existsSync(imagesFilePath)) {
        return [];
    }
    const data = fs.readFileSync(imagesFilePath);
    return JSON.parse(data);
};

const writeImages = (images) => {
    fs.writeFileSync(imagesFilePath, JSON.stringify(images, null, 2));
};

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Image Upload
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided.' });
    }

    const { productId } = req.body; // Optional: associate image with a product
    const images = readImages();
    const newImage = {
        id: Date.now().toString(),
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploader: req.user.username,
        uploadDate: new Date().toISOString(),
        imageUrl: `/uploads/${req.file.filename}`,
        productId: productId || null // Store productId if provided
    };
    images.push(newImage);
    writeImages(images);

    res.status(201).json({
        message: 'Image uploaded successfully.',
        imageUrl: newImage.imageUrl,
        imageId: newImage.id
    });
});

// Get all images (authenticated)
app.get('/api/images', authenticateToken, (req, res) => {
    const images = readImages();
    res.json(images);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access it at: http://localhost:${PORT}`);
});
