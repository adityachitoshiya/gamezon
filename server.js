import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gamezone',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage: storage });

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// MONGODB CONNECTION
// ==========================================
// We'll proceed without crashing if URI is missing to allow frontend dev
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_connection_string_here') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.log('⚠️ MONGODB_URI not set or is default. Waiting for user to configure .env');
}

// ==========================================
// MONGODB SCHEMAS
// ==========================================
const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  game: { type: String, required: true },
  console: { type: String, required: true }, // 'PS5' or 'PC'
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  slot: { type: String, required: true }, // '10:00 AM - 11:00 AM'
  status: { type: String, default: 'Confirmed' },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Game = mongoose.model('Game', gameSchema);

const heroSlideSchema = new mongoose.Schema({
  image: { type: String, required: true },
  label: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

// ==========================================
// TELEGRAM NOTIFICATION HELPER
// ==========================================
async function sendTelegramNotification(booking) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId || token === 'YOUR_BOT_TOKEN_HERE') {
    console.log('⚠️ Telegram not configured, skipping notification.');
    return;
  }

  const message = `
🎮 <b>NEW BOOKING RECORDED</b> 🎮
━━━━━━━━━━━━━━━━━━━━
👤 <b>Name:</b> ${booking.name}
📞 <b>Phone:</b> ${booking.phone}
🎯 <b>Game:</b> ${booking.game}
🖥️ <b>Console:</b> ${booking.console}
📅 <b>Date:</b> ${booking.date}
⏰ <b>Time:</b> ${booking.slot}
💳 <b>Price:</b> ₹99
━━━━━━━━━━━━━━━━━━━━
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Telegram Error:', error);
  }
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Get all public games
app.get('/api/games', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Fallback dummy data if DB not connected
      return res.json([
        { _id: '1', name: 'GTA V', type: 'Open World', image: 'https://images.unsplash.com/photo-1605901309584-699edbc39527?w=300&h=300&fit=crop' },
        { _id: '2', name: 'FIFA 25', type: 'Simulation', image: 'https://images.unsplash.com/photo-1518605368461-1e24744b8254?w=300&h=300&fit=crop' }
      ]);
    }
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching games' });
  }
});

// 2. Get booked slots for a specific date and console
app.get('/api/booked-slots', async (req, res) => {
  try {
    const { date, console: reqConsole } = req.query;
    if (!date || !reqConsole) {
      return res.status(400).json({ error: 'Date and console are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json([]); // Return empty if DB not connected yet
    }

    const bookings = await Booking.find({ date, console: reqConsole });
    const bookedSlots = bookings.map(b => b.slot);
    
    res.json(bookedSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, phone, email, game, console: reqConsole, date, slot } = req.body;

    if (!name || !phone || !game || !reqConsole || !date || !slot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (mongoose.connection.readyState !== 1) {
      // Allow proceeding in "dummy" mode if DB not connected so UI testing works
      console.log('Mock booking created (DB not connected):', req.body);
      await sendTelegramNotification(req.body);
      return res.status(201).json({ message: 'Booking mocked successfully', _id: 'mock_id' });
    }

    // Check if slot already booked
    const existing = await Booking.findOne({ date, slot, console: reqConsole });
    if (existing) {
      return res.status(400).json({ error: 'This slot is already booked for this console.' });
    }

    // Save to DB
    const newBooking = new Booking({ name, phone, email, game, console: reqConsole, date, slot });
    await newBooking.save();

    // Notify Admin via Telegram
    sendTelegramNotification(newBooking);

    res.status(201).json({ message: 'Booking confirmed', booking: newBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// CMS ROUTES (ADMIN)
// ==========================================

// Simple fetch all bookings for Admin panel
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const { id, password } = req.query;
    if (id !== 'aditya' || password !== 'chitoshiya') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json([{name: 'DB NOT CONNECTED', phone: 'N/A', date: 'N/A', slot: 'Configure .env MongoDB URI'}]);
    }

    // Return descending by creation date
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/bookings/:id', async (req, res) => {
  try {
    const { id, password } = req.query;
    if (id !== 'aditya' || password !== 'chitoshiya') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Games Management
app.post('/api/admin/games', upload.single('image'), async (req, res) => {
  try {
    const { id, password } = req.query;
    if (id !== 'aditya' || password !== 'chitoshiya') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type } = req.body;
    const image = req.file ? req.file.path : req.body.image;
    
    if (!name || !type || !image) {
      return res.status(400).json({ error: 'Missing game details or image' });
    }

    const newGame = new Game({ name, type, image });
    await newGame.save();
    res.status(201).json(newGame);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/games/:id', async (req, res) => {
  try {
    const { id: reqId, password } = req.query;
    if (reqId !== 'aditya' || password !== 'chitoshiya') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: 'Game deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hero Slides — Public
app.get('/api/hero', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const slides = await HeroSlide.find({ active: true }).sort({ order: 1, createdAt: 1 });
    res.json(slides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hero Slides — Admin: List all
app.get('/api/admin/hero', async (req, res) => {
  try {
    const { id, password } = req.query;
    if (id !== 'aditya' || password !== 'chitoshiya') return res.status(401).json({ error: 'Unauthorized' });
    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 });
    res.json(slides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hero Slides — Admin: Add
app.post('/api/admin/hero', upload.single('image'), async (req, res) => {
  try {
    const { id, password } = req.query;
    if (id !== 'aditya' || password !== 'chitoshiya') return res.status(401).json({ error: 'Unauthorized' });
    
    const { label, subtitle, order } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    if (!image) return res.status(400).json({ error: 'Image is required' });
    const slide = new HeroSlide({ image, label: label || '', subtitle: subtitle || '', order: order || 0 });
    await slide.save();
    res.status(201).json(slide);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hero Slides — Admin: Toggle active
app.patch('/api/admin/hero/:id', async (req, res) => {
  try {
    const { id, password } = req.query;
    if (id !== 'aditya' || password !== 'chitoshiya') return res.status(401).json({ error: 'Unauthorized' });
    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) return res.status(404).json({ error: 'Slide not found' });
    slide.active = !slide.active;
    await slide.save();
    res.json(slide);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hero Slides — Admin: Delete
app.delete('/api/admin/hero/:id', async (req, res) => {
  try {
    const { id: reqId, password } = req.query;
    if (reqId !== 'aditya' || password !== 'chitoshiya') return res.status(401).json({ error: 'Unauthorized' });
    await HeroSlide.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slide deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// START SERVER
// ==========================================
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });
}

export default app;
