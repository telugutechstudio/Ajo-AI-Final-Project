
const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const checkCredits = require('../middleware/credits');
const aiService = require('../services/geminiService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit

const handleAIRequest = (handler) => async (req, res) => {
    try {
        const result = await handler(req, res);
        res.json(result);
    } catch (error) {
        console.error(`AI route error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ msg: error.message || 'An internal AI service error occurred.' });
    }
};

router.post('/transcribe', [auth, checkCredits('SCRIBE'), upload.single('file')], handleAIRequest(async (req) => {
    const options = JSON.parse(req.body.options);
    return aiService.generateTranscript(options, req.file);
}));

router.post('/ocr', [auth, checkCredits('OCR'), upload.single('file')], handleAIRequest(async (req) => {
    return aiService.extractTextFromDocument(req.file);
}));

router.post('/tables', [auth, checkCredits('PDF_TO_EXCEL'), upload.single('file')], handleAIRequest(async (req) => {
    return aiService.extractTablesFromPdf(req.file);
}));

router.post('/ppt', [auth, checkCredits('PDF_TO_PPT'), upload.single('file')], handleAIRequest(async (req) => {
    return aiService.summarizePdfForPpt(req.file);
}));

router.post('/polish', [auth, checkCredits('AI_POLISH')], handleAIRequest(async (req) => {
    const { text } = req.body;
    const polishedText = await aiService.polishText(text);
    return { polishedText };
}));

router.post('/translate', [auth, checkCredits('AI_TRANSLATE')], handleAIRequest(async (req) => {
    const { text, targetLanguage } = req.body;
    const translatedText = await aiService.translateText(text, targetLanguage);
    return { translatedText };
}));

router.post('/analyze-scan', [auth, checkCredits('SCAN_TO_PDF')], handleAIRequest(async (req) => {
    const { base64Image, imageWidth, imageHeight } = req.body;
    return aiService.analyzeScannedPage(base64Image, imageWidth, imageHeight);
}));

router.post('/chat', [auth, checkCredits('AI_CHAT'), upload.single('file')], handleAIRequest(async (req) => {
    const { history, systemInstruction } = req.body;
    const parsedHistory = JSON.parse(history);
    const text = await aiService.processChatMessage(parsedHistory, systemInstruction, req.file);
    return { text };
}));

module.exports = router;
