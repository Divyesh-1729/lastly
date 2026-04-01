const cloudinary = require('cloudinary').v2; //Importing Cloudinary library to handle image uploads and management
const { CloudinaryStorage } = require('multer-storage-cloudinary'); //Importing CloudinaryStorage to integrate Cloudinary with Multer for file uploads

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME, //Cloudinary cloud name from environment variables
    api_key: process.env.CLOUD_API_KEY, //Cloudinary API key from environment variables
    api_secret: process.env.CLOUD_API_SECRET //Cloudinary API secret from environment variables
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary, //Using the configured Cloudinary instance
    params: {
        folder: 'wanderlust_DEV', //Folder in Cloudinary where images will be stored
        allowed_formats: ['jpeg', 'png', 'jpg'], //Allowed image formats for upload
        quality: 'auto',
        fetch_format: 'auto'
    }
});

module.exports = { storage, cloudinary }; //Exporting the configured storage and Cloudinary instance for use in other parts of the application