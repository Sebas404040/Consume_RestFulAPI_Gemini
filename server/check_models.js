import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
  try {
    console.log("🔍 Consultando modelos de CHAT disponibles...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API}`);
    const data = await response.json();

    if (data.models) {
      console.log("\n✅ Modelos de GENERACIÓN (Chat) disponibles:");
      // Filtramos los que soportan 'generateContent'
      const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
      
      chatModels.forEach(m => {
        console.log(`   - ${m.name}`);
      });

    } else {
      console.log("❌ Error al listar modelos:", data);
    }

  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

listModels();