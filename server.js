import express from "express";
import path from "path";

const app = express();

// CSP FIX — ADD HEADERS ALLOWING GOOGLE + PHONEPE
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://mercury.phonepe.com; " +
      "connect-src 'self' https://accounts.google.com https://mercury.phonepe.com; " +
      "img-src 'self' data: https://accounts.google.com https://mercury.phonepe.com; " +
      "frame-src https://accounts.google.com https://mercury.phonepe.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "font-src 'self' https://fonts.gstatic.com data:;"
  );
  next();
});

const __dirname = path.resolve();
const folder = path.join(__dirname, "dist/resume-analyzer-frontend/browser");

// serve static Angular app
app.use(express.static(folder));

// Always return index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(folder, "index.html"));
});

// Railway port support
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
