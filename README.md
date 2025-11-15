# 🎨 Frontend - Trip AI MVP

React-based chat interface for AI-powered travel planning.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

App runs on: `http://localhost:3000`

## 📱 Components

### `App.js`
Main application wrapper with header and branding.

### `components/Chat.js`
Core chat interface with:
- Message history
- User input
- Quick suggestions
- Travel data display
- Loading states

### `components/Message.js`
Individual message bubble with:
- User/Assistant styling
- Timestamp
- Markdown-like formatting
- Error states

### `components/TravelCard.js`
Travel data card displaying:
- Hotel/Restaurant info
- Images
- Ratings
- Google Maps links

## 🎨 Styling

### Color Scheme
- **Primary Gradient**: `#667eea` → `#764ba2`
- **Secondary**: `#f093fb` → `#f5576c`
- **Background**: White cards on gradient backdrop

### Animations
- Message slide-in
- Card hover effects
- Typing indicator
- Button interactions

### Responsive Breakpoints
- **Desktop**: > 768px
- **Mobile**: ≤ 768px

## 🔧 Configuration

### Backend Connection
Update `package.json`:
```json
{
  "proxy": "http://localhost:5000"
}
```

Or for production, update axios calls:
```javascript
// In Chat.js
axios.post('https://your-backend-url.com/api/chat', ...)
```

### Customization

**Branding:**
```javascript
// App.js
<h1>✈️ YOUR_BRAND_NAME</h1>
```

**Quick Suggestions:**
```javascript
// Chat.js
const quickSuggestions = [
  'Your custom suggestion 1',
  'Your custom suggestion 2',
  // ...
];
```

**Colors:**
Edit CSS files to change the theme colors.

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.6.0",
  "react-scripts": "5.0.1"
}
```

## 🌐 API Integration

### Chat Request
```javascript
const response = await axios.post('/api/chat', {
  message: userMessage,
  conversationHistory: previousMessages
});
```

### Response Handling
```javascript
if (response.data.success) {
  // Display AI message
  // Show travel data cards
  // Update conversation history
}
```

## 🎯 Features

✅ Real-time chat interface
✅ Message history (session-based)
✅ Quick suggestion buttons
✅ Travel data cards with images
✅ Typing indicator
✅ Error handling
✅ Markdown-like text formatting
✅ Mobile-responsive design

## 📱 Browser Testing

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## 🐛 Troubleshooting

**Blank Screen:**
- Check browser console for errors
- Verify backend is running
- Check network tab for failed requests

**Proxy Errors:**
- Make sure backend runs on port 5000
- Or update proxy setting in package.json

**Styling Issues:**
- Clear browser cache
- Check CSS files loaded correctly
- Verify no CSS conflicts

## 🚀 Deployment

### Vercel
```bash
npm run build
vercel
```

### Netlify
```bash
npm run build
# Drag & drop build folder to Netlify
```

### Environment Setup
For production, update API endpoint:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

Add to `.env.production`:
```env
REACT_APP_API_URL=https://your-backend-url.com
```

## 💡 Tips

- Keep conversation history under 10 messages for performance
- Images load lazily for better performance
- Travel cards support horizontal scroll on mobile
- Messages auto-scroll to bottom on new messages

---

**Happy Coding! 🎉**

