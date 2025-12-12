const express = require("express");
const path = require("path");

const app = express();

// CSP HEADERS
app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://mercury.phonepe.com; " +
      "connect-src 'self' http://localhost:5000 https://resuradar-api-production.up.railway.app https://resuradar-backend-production.up.railway.app https://accounts.google.com https://mercury.phonepe.com; " +
      "img-src 'self' data: https://accounts.google.com https://mercury.phonepe.com; " +
      "frame-src https://accounts.google.com https://mercury.phonepe.com; " +
      "style-src 'self' 'unsafe-inline' https://accounts.google.com; " +
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

const PORT = process.env.PORT || 4300;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
