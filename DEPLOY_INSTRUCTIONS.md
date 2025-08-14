# 🚀 STEP-BY-STEP DEPLOYMENT GUIDE

## Step 1: Deploy Backend to Railway

### Option A: Railway (Recommended - Easy)

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Choose "Deploy from GitHub repo"**
5. **Upload the `/app` folder contents** or connect your GitHub repo
6. **Railway will auto-detect** it's a Python project
7. **Set Environment Variables in Railway:**
   ```
   ENVIRONMENT=production
   ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
   ```
8. **Deploy!** Railway will give you a URL like `https://your-app-name.up.railway.app`

### Option B: Heroku (Alternative)

1. **Install Heroku CLI** and login: `heroku login`
2. **Create app:** `heroku create your-venue-app`
3. **From the `/app` directory:**
   ```bash
   git init
   heroku git:remote -a your-venue-app
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```
4. **Set environment variables:**
   ```bash
   heroku config:set ENVIRONMENT=production
   heroku config:set ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
   ```

---

## Step 2: Deploy Frontend to Netlify

### Method 1: Drag & Drop (Easiest)

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up/Login**
3. **Drag the `/frontend/dist/` folder** to the deploy area
4. **Your site will get a URL** like `https://amazing-unicorn-123.netlify.app`
5. **In Site Settings > Environment Variables, add:**
   ```
   VITE_API_BASE_URL = https://your-railway-app.up.railway.app
   ```
6. **Redeploy** (Site Settings > Deploys > Trigger deploy)

### Method 2: GitHub Integration

1. **Push your code to GitHub**
2. **Connect Netlify to your GitHub repo**
3. **Build settings:** (auto-detected from `netlify.toml`)
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Add environment variable:**
   ```
   VITE_API_BASE_URL = https://your-railway-app.up.railway.app
   ```

---

## Step 3: Update CORS Settings

Once you have your Netlify URL, update your backend's environment variables:

**In Railway/Heroku:**
```
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app,http://localhost:3000
```

---

## Step 4: Test Everything! 

1. **Visit your Netlify URL**
2. **Click "Register"** to create the first user account
3. **Test login/logout**
4. **Create venues and events**
5. **Try the select all functionality**
6. **Check the API documentation page**

---

## 📁 Files Ready for Deployment

**Backend (`/app/` folder):**
- ✅ `requirements-clean.txt` - Dependencies
- ✅ `Procfile` - Heroku start command  
- ✅ `railway.toml` - Railway configuration
- ✅ `runtime.txt` - Python version
- ✅ All Python files with user authentication

**Frontend (`/frontend/dist/` folder):**
- ✅ Built production files ready to upload
- ✅ `_redirects` for SPA routing
- ✅ Environment variable support

---

## 🔗 Expected URLs

After deployment you'll have:
- **Backend API:** `https://your-app.up.railway.app`
- **Frontend App:** `https://your-app.netlify.app`
- **API Docs:** `https://your-app.up.railway.app/docs` (FastAPI auto-docs)

---

## 🐛 Troubleshooting

**CORS Errors?**
- Make sure `ALLOWED_ORIGINS` includes your Netlify URL
- Redeploy backend after changing environment variables

**Frontend won't load?**
- Check `VITE_API_BASE_URL` is set correctly in Netlify
- Trigger a new deploy after changing env vars

**Registration not working?**
- Check browser network tab for API errors
- Verify backend is responding at `/auth/register`

**Need help?** Check the browser console and network tab for specific error messages!

---

## 🎉 You're Ready!

Follow these steps and your venue management app with user registration will be live on the internet! 🚀