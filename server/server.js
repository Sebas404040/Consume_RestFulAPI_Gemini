import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = 'campus_collection';

app.post('/chat', async (req, res) => {
    const { prompt, history } = req.body;

    try {
        console.log("👤 Pregunta del usuario:", prompt);

        const result = await embeddingModel.embedContent(prompt);
        const queryVector = result.embedding.values;

        const searchResults = await qdrant.search(COLLECTION_NAME, {
            vector: queryVector,
            limit: 3, 
        });

        const contextText = searchResults.map(res => res.payload.contenido).join("\n\n");
        
        console.log("Contexto encontrado en Qdrant:", searchResults.length > 0 ? "Sí" : "No");

        const fullPrompt = `
        Eres un asistente inteligente experto en Campuslands.
        Usa la siguiente información de contexto para responder la pregunta del usuario.
        Si la respuesta no está en el contexto, responde amablemente que no tienes esa información específica.
        
        CONTEXTO:
        ${contextText}

        PREGUNTA DEL USUARIO:
        ${prompt}
        `;

        const chat = chatModel.startChat({
            history: history || [],
        });

        const resultChat = await chat.sendMessage(fullPrompt);
        const responseText = resultChat.response.text();

        res.json({ candidates: [{ content: { parts: [{ text: responseText }] } }] });

    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('🚀 Servidor listo en http://localhost:3000'));