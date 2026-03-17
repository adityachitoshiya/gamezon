require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String },
  image: { type: String }
});
const Game = mongoose.model('Game', gameSchema);

const heroSlideSchema = new mongoose.Schema({
  image: { type: String, required: true },
  label: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
});
const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

const INITIAL_GAMES = [
  { name: 'Cyberpunk 2077', type: 'Open World RPG', image: 'https://images.unsplash.com/photo-1605901309584-699edbc39527?w=500&q=80' },
  { name: 'FIFA 24', type: 'Sports', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=80' },
  { name: 'Valorant', type: 'Tactical Shooter', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80' },
  { name: 'Spider-Man 2', type: 'Action Adventure', image: 'https://images.unsplash.com/photo-1605901302388-349f572a15f0?w=500&q=80' },
  { name: 'Call of Duty: MW3', type: 'FPS', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Forza Horizon 5', type: 'Racing', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop' }
];

const INITIAL_HEROES = [
  { image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop', label: 'Welcome to GameZone', subtitle: 'Experience the ultimate gaming lounge!', order: 1 },
  { image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop', label: 'Play Next-Gen Consoles', subtitle: 'PS5 & Epic PC Setups available.', order: 2 }
];

async function seed() {
  try {
    if (!MONGODB_URI) throw new Error("No MONGODB_URI found.");
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const gameCount = await Game.countDocuments();
    if (gameCount === 0) {
      console.log('Seeding games...');
      await Game.insertMany(INITIAL_GAMES);
      console.log('Games seeded!');
    } else {
      console.log('Games already exist in DB.');
    }

    const heroCount = await HeroSlide.countDocuments();
    if (heroCount === 0) {
      console.log('Seeding hero slides...');
      await HeroSlide.insertMany(INITIAL_HEROES);
      console.log('Hero slides seeded!');
    } else {
      console.log('Hero slides already exist in DB.');
    }
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.connection.close();
  }
}

seed();
