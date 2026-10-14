# ✈️ TripSaathi

TripSaathi is an AI-powered travel assistant that automates flight discovery, cancellation policy intelligence, hotel reservations, and 1-click booking deep links.

---

## 📁 Project Structure

```
TripSaathi/
├── frontend/               # 📱 React Native (Expo) Mobile & Web Application
│   ├── App.js              # Entry screen
│   ├── package.json        # Frontend dependencies
│   ├── assets/             # App icons and splash screen
│   └── app.json            # Expo configuration
│
└── backend/                # 🧠 Python Flask AI Backend (TinyFish)
    ├── app.py              # API routes & TinyFish AI agent pipelines
    ├── requirements.txt    # Python dependencies
    ├── .env.example        # Environment variables template
    └── .env                # Private API keys (gitignored)
```

---

## 🚀 Getting Started

### 1. Run the Backend (Python Flask API)
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate       # On Windows
pip install -r requirements.txt
python app.py
```
> The backend server starts at `http://localhost:7000`.

### 2. Run the Frontend (React Native Expo App)
```bash
cd frontend
npm install

# Run in Web Browser
npm run web

# Run on Physical Phone
npm start
# (Scan the terminal QR code using the Expo Go mobile app)
```
