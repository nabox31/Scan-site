# Webcomic Reader

A simple, clean, and efficient web platform for reading webcomics with vertical scrolling (Webtoon style).

## Features

- **Vertical Scrolling Reader**: Webtoon-style seamless reading experience
- **Mobile-First Design**: Optimized for mobile devices
- **Dark Mode**: Easy on the eyes
- **Supabase Backend**: Database and storage managed by Supabase
- **Simple Admin Panel**: Easy content management
- **Lazy Loading**: Optimized image loading for long chapters
- **No Complex Frameworks**: Pure HTML, CSS, and vanilla JavaScript

## Project Structure

```
/
├── css/
│   └── style.css              # All styles (dark theme, mobile-first)
├── js/
│   ├── config.js              # Supabase configuration
│   ├── utils.js               # Helper functions
│   ├── home.js                # Home page logic
│   ├── series.js              # Series page logic
│   ├── reader.js              # Reader page logic
│   └── admin.js               # Admin panel logic
├── pages/
│   ├── series.html            # Series detail page
│   ├── reader.html            # Chapter reader
│   └── admin.html             # Admin panel
├── assets/
│   └── (placeholder images)
├── index.html                 # Home page (series list)
├── supabase_schema.sql        # Database schema
└── README.md                  # This file
```

## Setup Instructions

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once created, go to **Project Settings > API** and copy:
   - **Project URL**: `https://nxyqhjzurtgpxewrbcrz.supabase.co`
   - **anon/public key**: Copy this for step 2

3. Open the **SQL Editor** and run the contents of `supabase_schema.sql`

4. Go to **Storage** and create a new bucket:
   - Name: `comics`
   - Public bucket: **Enabled**
   - Click **Create bucket**

5. Set bucket permissions (in the bucket settings):
   - **Policies** > **Add Policy**:
     - **Allowed operations**: SELECT, INSERT, UPDATE, DELETE
     - **Target roles**: anon, authenticated
     - **Policy definition**: `true`

### 2. Configure Your Project

1. Open `js/config.js`
2. Replace `YOUR_ANON_KEY_HERE` with your actual Supabase anon key:

```javascript
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...'; // Your key here
```

3. (Optional) Change the admin password in `js/admin.js`:

```javascript
const ADMIN_PASSWORD = 'your-secure-password';
```

### 3. Test Locally

Since this is a static website (HTML/CSS/JS), you can simply open `index.html` in a browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### 4. Add Content (via Admin Panel)

1. Navigate to `pages/admin.html`
2. Enter the admin password (default: `admin123`)
3. **Create a Series**:
   - Fill in the title (required)
   - Add description (optional)
   - Add cover image URL (optional - you can upload to Supabase Storage first)
   - Click "Create Series"

4. **Add a Chapter**:
   - Select your series
   - Enter chapter number (e.g., 1, 1.5, 2)
   - Add chapter title (optional)
   - Click "Create Chapter"

5. **Upload Images**:
   - Select series and chapter
   - Click the upload zone or drag & drop images
   - Images are auto-ordered by filename
   - Click "Upload Images"

### 5. Read Your Comics!

- Go to Home page to see your series
- Click a series to see chapters
- Click a chapter to read!

## Deploy to Cloudflare Pages

### Option 1: Git + Cloudflare Pages (Recommended)

1. Push your project to GitHub/GitLab
2. Go to [Cloudflare Pages](https://dash.cloudflare.com)
3. Click **Create a project** > **Connect to Git**
4. Select your repository
5. Build settings:
   - **Build command**: (leave empty - no build needed)
   - **Build output directory**: `/`
6. Click **Save and Deploy**

### Option 2: Direct Upload

1. Zip your project files (all files in the root folder)
2. Go to [Cloudflare Pages](https://dash.cloudflare.com)
3. Click **Create a project** > **Upload assets**
4. Upload your zip file
5. Click **Deploy**

### Option 3: Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create pages project
wrangler pages project create webcomic-reader

# Deploy
wrangler pages deploy . --project-name=webcomic-reader
```

## Other Deployment Options

- **Vercel**: Drag and drop your folder to vercel.com
- **Netlify**: Drag and drop to netlify.com
- **GitHub Pages**: Enable in repository settings

## Security Note

This setup uses a **simple password** for the admin panel. For production use with sensitive content, consider:

1. Using Supabase Auth for proper authentication
2. Implementing RLS policies that check for authenticated users only
3. Using a backend API key for admin operations

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Database not connected" | Check your Supabase URL and anon key in `config.js` |
| Images not uploading | Check storage bucket permissions in Supabase |
| Can't create series | Verify SQL schema was run successfully |
| CORS errors | Ensure your domain is allowed in Supabase settings |

## Customization

- **Colors**: Edit CSS variables in `css/style.css` (top of file)
- **Layout**: Modify grid classes and breakpoints
- **Fonts**: Add Google Fonts link to HTML files

## License

MIT License - Feel free to use and modify!