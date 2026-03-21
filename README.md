# 🌿 Wajbeh - وجبة

> Save food. Save money. Save Jordan.

Wajbeh is a Too Good to Go inspired food rescue app for Jordan. It connects customers with restaurants, cafés, and bakeries in Amman that have surplus food at the end of the day — sold at up to 70% off in surprise bags.

---

## 📱 Screenshots

Coming soon.

---

## ✨ Features

### For Customers
- 🏠 Browse available surprise bags near you today
- 🔍 Search by restaurant, area, or category
- 🛍️ Reserve a bag and get a unique pickup code
- 📋 Track your orders and reservation status
- ✅ Confirm pickup after collecting your bag
- 👤 Personal profile with order history

### For Restaurants
- 📊 Restaurant dashboard with daily stats
- ➕ Post new bags with price, quantity, and description
- 🎫 Verify customer pickup codes
- ✅ Confirm customer arrival
- 🔴 Mark bags as sold out

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email) |
| Real-time | Supabase Realtime |
| Navigation | React Navigation |

---

## 🗄️ Database Schema
```
restaurants     — restaurant profiles linked to owner accounts
bags            — daily surplus bags posted by restaurants
orders          — reservations made by customers
users           — customer profiles
profiles        — auth role (customer vs restaurant)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- Expo CLI
- Supabase account

### Installation

1. Clone the repo
```bash
git clone https://github.com/AbuArida72/Wajbeh_App.git
cd Wajbeh_App
```

2. Install dependencies
```bash
npm install
```

3. Set up Supabase
   - Create a new project at supabase.com
   - Run the SQL schema from `/sql/schema.sql`
   - Copy your project URL and anon key

4. Configure environment
   - Open `lib/supabase.js`
   - Replace the URL and anon key with yours

5. Start the app
```bash
npx expo start
```

---

## 🏗️ Project Structure
```
wajbeh/
├── screens/
│   ├── LandingScreen.js         # Landing page for new users
│   ├── SignInScreen.js          # Email sign in
│   ├── SignUpScreen.js          # New user registration
│   ├── HomeScreen.js            # Browse available bags
│   ├── SearchScreen.js          # Search restaurants
│   ├── BagDetailScreen.js       # Bag details + reserve
│   ├── ConfirmationScreen.js    # Post-reservation confirmation
│   ├── OrdersScreen.js          # User order history
│   ├── ProfileScreen.js         # User profile + sign out
│   ├── DashboardScreen.js       # Restaurant dashboard
│   └── RestaurantOrdersScreen.js # Restaurant reservations
├── lib/
│   └── supabase.js              # Supabase client
├── assets/                      # Images and icons
├── App.js                       # Root navigator + auth logic
└── README.md
```

---

## 🔄 Pickup Flow
```
Customer reserves bag → Gets pickup code
       ↓
Customer shows code at restaurant
       ↓
Restaurant enters code → Confirms arrival
       ↓
Customer sees "On my way!" status
       ↓
Customer confirms pickup in app
       ↓
Order marked as fulfilled ✅
```

---

## 🗺️ Roadmap

- [ ] Phone number OTP authentication
- [ ] Push notifications for pickup reminders
- [ ] Tap Payments integration for Jordan
- [ ] Ratings and reviews
- [ ] Map view of nearby restaurants
- [ ] Arabic language support (RTL)
- [ ] iOS and Android app store release

---

## 👨‍💻 Built By

**AbuArida72** — built as an MVP to validate the concept of food rescue in Jordan.

---

## 📬 Contact

For restaurant partnerships: hello@wajbeh.jo

---

## 📄 License

MIT License — feel free to use and build on this.
```

Save it then run:
```
git add .
git commit -m "Add README"
git push origin main
