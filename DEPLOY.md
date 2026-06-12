# Deploy Guide

## 1. Frontend (Vercel) — DONE ✅

**URL:** https://pergola-builder.vercel.app

Already deployed to your Vercel account (narminder1@gmail.com).

## 2. Backend (Render.com) — YOU NEED TO DO THIS

### Step A: Create MongoDB Atlas (free database)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with **narminder1@gmail.com**
3. Create a **Shared (Free)** cluster
4. In Database Access, create a user with password
5. In Network Access, add IP `0.0.0.0/0` (allows all)
6. Click **Connect** → **Drivers** → **Python** → copy the connection string
7. Replace `<password>` with your actual password → this is your `MONGO_URL`

### Step B: Create Resend Account (for email)

1. Go to https://resend.com
2. Sign up with **narminder1@gmail.com**
3. Add your domain or use the default onboarding domain
4. Go to API Keys → Create API Key → copy it → this is your `RESEND_API_KEY`

### Step C: Deploy to Render

1. Go to https://dashboard.render.com
2. Sign up with **narminder1@gmail.com**
3. Click **New +** → **Blueprint**
4. Connect your GitHub repo: `Arminde-Nijjar/Allans-Pergola`
5. Render will auto-detect `render.yaml`
6. Before deploying, add these **Environment Variables**:
   - `MONGO_URL` = your MongoDB Atlas connection string
   - `RESEND_API_KEY` = your Resend API key
   - `TO_EMAILS` = `narminder1@gmail.com`
   - `FROM_EMAIL` = `noreply@allanslandscaping.ca`
7. Name the service: **pergola-builder-api** (this matches the URL already set in the frontend)
8. Click **Apply**

Your backend will be live at: `https://pergola-builder-api.onrender.com`

### Step D: Test

1. Open https://pergola-builder.vercel.app
2. Build a kit pergola
3. Go to Submit step, fill the form
4. Click **Send my design**
5. Check narminder1@gmail.com for the quote email

---

## Troubleshooting

- **Email not arriving?** Check Resend dashboard for delivery status
- **Quote not saving?** Check MongoDB Atlas → Browse Collections
- **Frontend can't reach backend?** Make sure the Render service name is exactly `pergola-builder-api`
