var cloudinary = require('cloudinary');
if (process.env.NODE_ENV === 'development') {
  cloudinary.config({
    cloud_name: 'hlfaynn4b',
    api_key: '919912488678985',
    api_secret: '_lIOg2cm8e4vLjqT5vwbnsaqG2w',
  });
}
