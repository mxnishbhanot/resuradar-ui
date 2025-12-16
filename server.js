const express = require("express");
const path = require("path");

const app = express();

// CSP HEADERS
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +

    // Scripts (JS + module workers fallback)
    "script-src 'self' 'unsafe-inline' blob: https://accounts.google.com https://mercury.phonepe.com https://cdn.jsdelivr.net; " +

    // Explicit worker rule (important)
    "worker-src 'self' blob:; " +

    // API / fetch / XHR
    "connect-src 'self' http://localhost:5000 https://resuradar-api-production.up.railway.app https://accounts.google.com https://mercury.phonepe.com; " +

    // Images
    "img-src 'self' data: https://accounts.google.com https://mercury.phonepe.com https://lh3.googleusercontent.com; " +

    // Frames (OAuth / PhonePe)
    "frame-src https://accounts.google.com https://mercury.phonepe.com; " +

    // Styles
    "style-src 'self' 'unsafe-inline' https://accounts.google.com; " +

    // Fonts
    "font-src 'self' https://fonts.gstatic.com data:;"
  );
  next();
});

// Express uses CommonJS, so __dirname works now
const folder = path.join(__dirname, "dist/resume-analyzer-frontend/browser");

app.use(express.static(folder));

// Express v5 wildcard fix
app.get("*", (req, res) => {
  res.sendFile(path.join(folder, "index.html"));
});

const PORT = process.env.PORT || 4400;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
