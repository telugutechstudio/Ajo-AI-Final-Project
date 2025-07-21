
const { GoogleGenAI, Type } = require("@google/genai");

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SCHEMAS (Copied from frontend) ---
const transcriptionSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        segments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    speaker: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                },
                required: ["speaker", "startTime", "endTime", "text"],
            },
        },
    },
    required: ["title", "segments"],
};

const ocrSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        text: { type: Type.STRING }
    },
    required: ["title", "text"]
};

const tableExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        tables: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    data: {
                        type: Type.ARRAY,
                        items: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                },
                required: ["title", "data"]
            }
        }
    },
    required: ["title", "tables"]
};

const pptSummarySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        slides: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    bulletPoints: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["title", "bulletPoints"]
            }
        }
    },
    required: ["title", "slides"]
};

const scanAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        isDocumentFound: { type: Type.BOOLEAN },
        feedback: { type: Type.STRING },
        boundingBox: {
            type: Type.OBJECT,
            properties: {
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER },
                width: { type: Type.INTEGER },
                height: { type: Type.INTEGER }
            },
            nullable: true
        }
    },
    required: ["isDocumentFound", "feedback", "boundingBox"]
};

const fileToGenerativePart = (file) => {
    return {
        inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
        },
    };
};

const base64ToGenerativePart = (base64, mimeType) => ({
    inlineData: {
        data: base64,
        mimeType: mimeType,
    }
});


// --- API FUNCTIONS ---

const generateTranscript = async (options, file) => {
    const audioPart = fileToGenerativePart(file);
    const speakerPrompt = options.enableSpeakerRecognition ? "Identify and label each speaker." : "Do not identify different speakers.";
    const audioRestorationPrompt = options.enableAudioRestoration ? "Apply AI audio restoration." : "Transcribe as-is.";

    const prompt = `Transcribe the audio file. Language: ${options.language}. Speakers: ${speakerPrompt}. Enhancement: ${audioRestorationPrompt}. Output MUST be a single, valid JSON object strictly adhering to the schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }, audioPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: transcriptionSchema,
        },
    });
    const parsedJson = JSON.parse(response.text.trim());
    if (!options.enableSpeakerRecognition) {
        parsedJson.segments.forEach(seg => seg.speaker = null);
    }
    if (!parsedJson.title) parsedJson.title = file.originalname;
    return parsedJson;
};

const extractTextFromDocument = async (file) => {
    const documentPart = fileToGenerativePart(file);
    const prompt = `Extract all text content from the document. Preserve formatting. Generate a concise title. The output MUST be a single, valid JSON object adhering to the schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }, documentPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: ocrSchema
        }
    });
    return JSON.parse(response.text.trim());
};

const polishText = async (text) => {
    const prompt = `Redraft the following text to be more clear, concise, and professional. Correct any obvious OCR errors. Preserve the original meaning. Return only the polished text.\n\nOriginal Text:\n---\n${text}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const translateText = async (text, targetLanguage) => {
    const prompt = `Perform a direct, literal translation of the text into ${targetLanguage}. Return only the translated text.\n\nSource Text:\n---\n${text}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
};

const extractTablesFromPdf = async (file) => {
    const documentPart = fileToGenerativePart(file);
    const prompt = `Extract all tables from the document. Provide a title for each. Return a single, valid JSON object adhering to the schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }, documentPart] },
        config: { responseMimeType: "application/json", responseSchema: tableExtractionSchema }
    });
    return JSON.parse(response.text.trim());
};

const summarizePdfForPpt = async (file) => {
    const documentPart = fileToGenerativePart(file);
    const prompt = `Summarize the document into a slide deck format (main title, slide titles, bullet points). Return a single, valid JSON object adhering to the schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }, documentPart] },
        config: { responseMimeType: "application/json", responseSchema: pptSummarySchema }
    });
    return JSON.parse(response.text.trim());
};

const analyzeScannedPage = async (base64Image, imageWidth, imageHeight) => {
    const imagePart = base64ToGenerativePart(base64Image, 'image/jpeg');
    const prompt = `Analyze this document image (${imageWidth}x${imageHeight} pixels). Determine if a document is visible, provide a tight bounding box in pixels, and give short user feedback (e.g., 'Looks clear!'). Return a single, valid JSON object adhering to the schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema: scanAnalysisSchema }
    });
    return JSON.parse(response.text.trim());
};

const processChatMessage = async (history, systemInstruction, file) => {
    const contents = [];
    
    // Convert history to Gemini format
    history.forEach(msg => {
        contents.push({
            role: msg.role,
            parts: [{ text: msg.text }]
        });
    });

    if (file) {
        // Add the file to the latest user message
        const lastContent = contents[contents.length - 1];
        if (lastContent && lastContent.role === 'user') {
            lastContent.parts.push(fileToGenerativePart(file));
        }
    }
    
    // The last message is the current user prompt, which we've added to `contents`.
    // The history sent from the frontend includes the user's latest message, so we just pass it on.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: systemInstruction
        }
    });

    return response.text;
};


module.exports = {
    generateTranscript,
    extractTextFromDocument,
    polishText,
    translateText,
    extractTablesFromPdf,
    summarizePdfForPpt,
    analyzeScannedPage,
    processChatMessage,
};
