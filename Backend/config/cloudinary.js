import { v2 as cloudinary } from "cloudinary";

import dotenv from 'dotenv';

import fs from 'fs';
// Load environment variables
dotenv.config();

// Validate required configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_SECRET_KEY) {
  throw new Error('Missing Cloudinary configuration in environment variables');
}
export const connectCloudinary = async () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
    secure: true 
  });
};
console.log('Cloudinary configured successfully');

export const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto'
    });
    
    // Delete the temporary file
    fs.unlinkSync(filePath);
    
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    fs.unlinkSync(filePath); // Clean up temp file on error
    throw err;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error("Error deleting from Cloudinary:", err);
    throw err;
  }
};

export default connectCloudinary;
