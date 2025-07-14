import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Función para validar reCAPTCHA v2
async function validateRecaptcha(token) {
  const secretKey =
    process.env.RECAPTCHA_SECRET_KEY_V2 ||
    "6Ld3MWwrAAAAADF8CE_NONfAERsqUDZcJazp8OFZ";
  if (!secretKey) {
    throw new Error("Falta la variable de entorno RECAPTCHA_SECRET_KEY_V2");
  }
  const url = `https://www.google.com/recaptcha/api/siteverify`;
  const params = new URLSearchParams();
  params.append("secret", secretKey);
  params.append("response", token);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const data = await response.json();
  return data;
}

// Ruta para validar el token
app.post("/validate-recaptcha", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token requerido",
    });
  }
  try {
    const result = await validateRecaptcha(token);
    res.json({
      success: result.success,
      challenge_ts: result.challenge_ts,
      hostname: result.hostname,
      errorCodes: result["error-codes"] || [],
      fullResponse: result,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "Servidor reCAPTCHA v2 validator funcionando",
    endpoints: {
      "POST /validate-recaptcha": "Validar token reCAPTCHA v2",
      "GET /": "Este endpoint",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log("📝 Endpoints disponibles:");
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   POST http://localhost:${PORT}/validate-recaptcha`);
});
