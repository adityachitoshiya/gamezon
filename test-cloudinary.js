import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Testing connection with cloud name:", process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.api.ping()
  .then(res => console.log('✅ Cloudinary Connection Test Successful:', res.status === 'ok' ? 'OK' : res))
  .catch(err => console.error('❌ Cloudinary Connection Failed:', err.message || err));
