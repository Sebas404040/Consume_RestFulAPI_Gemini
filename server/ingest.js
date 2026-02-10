import { GoogleGenerativeAI } from "@google/generative-ai";
import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

const misDatos = [
    { id: 1, text: "Campuslands es un programa educativo enfocado en tecnología y desarrollo de software." },
    { id: 2, text: "La metodología de Campuslands se basa en el aprendizaje práctico y proyectos reales." },
    { id: 3, text: "Los estudiantes de Campuslands aprenden lenguajes como JavaScript, Python y bases de datos." },
    { id: 4, text: "El horario de entrenamiento suele ser intensivo, simulando un entorno laboral real." }
];

async function main() {
    const COLLECTION_NAME = 'campus_collection';
    
    const result = await qdrant.getCollections();
    const exists = result.collections.some(c => c.name === COLLECTION_NAME);
    
    if (exists) {
        await qdrant.deleteCollection(COLLECTION_NAME);
    }

    await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
            size: 3072,
            distance: 'Cosine',
        },
    });


    const points = [];
    
    for (const item of misDatos) {
        try {
            const result = await model.embedContent(item.text);
            const vector = result.embedding.values;

            points.push({
                id: item.id,
                vector: vector,
                payload: { contenido: item.text }
            });
        } catch (error) {
            console.error(`Error generando vector para ID ${item.id}:`, error.message);
        }
    }

    if (points.length > 0) {
        await qdrant.upsert(COLLECTION_NAME, {
            wait: true,
            points: points,
        });
        console.log(`Se subieron ${points.length} documentos a la base de datos.`);
    } else {
        console.log("No se subieron datos debido a errores.");
    }
}

main().catch(console.error);