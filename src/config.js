// API Configuration
const config = {
  // Use environment variable if available, otherwise fallback to localhost for development
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
};

export default config;

