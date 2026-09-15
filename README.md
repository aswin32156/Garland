# 🌸 Malligai Garlands (மல்லிகை மாலைகள்)

> **Fresh Handcrafted Flower Garlands — Pre-Order Online for Temple, Weddings & Special Celebrations.**

Malligai Garlands is a modern, full-stack e-commerce web application designed for traditional flower garland pre-ordering, custom pickup scheduling, instant real-time UPI/Razorpay payments, and seamless order management for both customers and shop owners.

---

## ✨ Features

### 🛍️ Customer Experience
- **Curated Garland Catalog**: High-resolution gallery featuring Wedding, Temple, Pooja, Festival, Birthday, and VIP reception garlands with flower details (Jasmine, Rose, Marigold, Lotus, Tuberose).
- **Full-Picture Inspection**: Click-to-maximize garland lightbox with zoom controls up to 300% to view uncropped petal arrangements and knotting craftsmanship.
- **Flexible Store Pickup Scheduling**: Select 2-hour standard intervals (8:00 AM to 8:00 PM) or specify any custom pickup time range with unlimited order availability.
- **Real-Time UPI & Razorpay Payments**:
  - Dynamic on-screen UPI QR Code with pre-filled amount payload for Google Pay, PhonePe, and Paytm.
  - Razorpay gateway integration for Credit/Debit Cards (Visa, MasterCard, RuPay) and Net Banking.
  - Zero unpaid orders guarantee — transaction auto-cancels if payment is not completed.
- **Order Confirmation & Digital Receipt**:
  - Printable receipt with live counter pickup verification QR code.
  - Direct 1-tap **Call (+91 93446 76293)** and **WhatsApp** support buttons for order inquiries.

### 🏪 Shop Owner Dashboard (`/owner/dashboard`)
- **Instant Real-Time Order Alerts**: Web Audio dual-tone sound chime and live toast notifications triggered the second a customer completes payment.
- **"Payment Option Accepted Order" Cards**: Comprehensive customer profiles (name, phone number, WhatsApp link, scheduled pickup time window, and payment reference).
- **Itemized "What They Bought" Breakdown**: Exact garland thumbnails, quantities, unit prices, subtotal amounts, and custom instructions.
- **Garland Maximizer & Customer Order History**: Click any ordered garland item to view high-resolution photos and inspect the customer's lifetime order history.
- **Order Status Tracking**: One-tap fulfillment workflows (`Payment Accepted` → `Preparing Flowers` → `Ready for Pickup` → `Collected`).

### ⚙️ Admin Catalog Management (`/admin/dashboard`)
- Add, edit, or remove garlands, update pricing, toggle featured products, and monitor store-wide analytics.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide Icons](https://lucide.dev/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) with local storage persistence |
| **Database & Backend** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Realtime websockets) |
| **Payment Gateways** | [Razorpay](https://razorpay.com/) & Real-time UPI Deep Linking (`qrcode.react`) |
| **Deployment** | [Vercel](https://vercel.com/) (Zero-configuration CI/CD) |

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/aswin32156/Garland.git
cd Garland
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory (refer to `.env.example`):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Malligai Garlands
```

### 4. Set Up Database Schema
1. Create a project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).

### 5. Run the Local Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🌐 Deploying to Vercel

1. Push this repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New..."** → **Project**.
3. Select the `Garland` repository and click **Import**.
4. Add the environment variables from your `.env.local` file.
5. Click **Deploy**. Vercel will build and publish your website with free SSL!

---

## 📞 Contact & Support

**Malligai Garlands (மல்லிகை மாலைகள்)**  
📍 Gandhi Market, Trichy, Tamil Nadu, India  
📞 Phone: **+91 93446 76293**  
💬 WhatsApp: **+91 93446 76293**  

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
