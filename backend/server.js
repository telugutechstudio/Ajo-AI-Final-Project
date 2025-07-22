// --- NEW: Module existence check at the very top ---
try {
    require.resolve('@google/genai');
} catch (e) {
    console.error("\n\n\x1b[31m--- FATAL STARTUP ERROR ---\x1b[0m");
    console.error("\x1b[33mముఖ్యమైన Google AI లైబ్రరీ '@google/genai' కనపడలేదు. బహుశా అది సరిగ్గా ఇన్‌స్టాల్ కాలేదు.\x1b[0m");
    console.error("\x1b[33mఈ సమస్యను పరిష్కరించడానికి, దయచేసి ఈ 'క్లీన్ రీ-ఇన్‌స్టాల్' కమాండ్‌ను మీ బ్యాకెండ్ టెర్మినల్‌లో రన్ చేయండి:\x1b[0m\n");
    console.error("  \x1b[32mnpm run reinstall\x1b[0m\n");
    console.error("\x1b[33mఆ తర్వాత, సర్వర్‌ను మళ్ళీ ప్రారంభించండి:\x1b[0m\n");
    console.error("  \x1b[32mnpm run dev\x1b[0m\n");
    process.exit(1);
}

// Use CommonJS require syntax for Node.js backend
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Load environment variables from .env file
dotenv.config();

// --- CRITICAL STARTUP CHECKS for .env file ---
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || !process.env.API_KEY) {
    console.error("\n\n\x1b[31m--- FATAL STARTUP ERROR ---\x1b[0m");
    console.error("\x1b[33m'.env' ఫైల్‌లో అవసరమైన ఒకటి లేదా అంతకంటే ఎక్కువ వివరాలు లేవు.\x1b[0m");
    console.error("దయచేసి మీ 'backend' ఫోల్డర్‌లో \x1b[32m.env\x1b[0m అనే ఫైల్ సరిగ్గా ఉందని నిర్ధారించుకోండి.");
    console.error("ఈ ఫైల్‌లో ఈ క్రింది కీలు ఉండాలి:\n");
    console.error("  \x1b[36mMONGODB_URI\x1b[0m=\x1b[90m'మీ mongodb కనెక్షన్ స్ట్రింగ్ ఇక్కడ ఉండాలి'\x1b[0m");
    console.error("  \x1b[36mJWT_SECRET\x1b[0m=\x1b[90m'సెషన్ల కోసం మీ రహస్య కీ ఇక్కడ ఉండాలి'\x1b[0m");
    console.error("  \x1b[36mAPI_KEY\x1b[0m=\x1b[90m'మీ google gemini api కీ ఇక్కడ ఉండాలి'\x1b[0m\n");
    console.error("\x1b[33mACTION: దయచేసి మీ '.env' ఫైల్‌ను సృష్టించండి లేదా సరిచూడండి, ఆపై సర్వర్‌ను రీస్టార్ట్ చేయండి.\x1b[0m\n");
    process.exit(1);
}

// --- NEW: CORS Startup Check ---
if (!process.env.CORS_ORIGIN) {
    console.warn("\n\n\x1b[33m--- CORS WARNING ---\x1b[0m");
    console.warn("\x1b[33m'CORS_ORIGIN' environment variable is not set.\x1b[0m");
    console.warn("The backend will default to allowing requests from the known Vercel URL, but it's recommended to set this variable explicitly in your hosting environment (e.g., Render) for production.");
    console.warn("Set \x1b[32mCORS_ORIGIN\x1b[0m to your frontend's full URL, for example: \x1b[36mhttps://ajo-ai-final-project.vercel.app\x1b[0m\n");
}


// Initialize the Express app
const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173', // Local dev environment
    'https://ajo-ai-final-project.vercel.app', // Production frontend
    /https:\/\/[a-zA-Z0-9-]+-telugutechstudio\.vercel\.app/ // Regex for Vercel preview deployments
];

if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}

console.log('CORS Whitelist:', allowedOrigins);

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // To parse JSON bodies, increased limit for results
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI;

const ensureAdminUserExists = async () => {
    try {
        const adminEmail = 'admin@ajoai.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            console.log('Admin user not found. Creating default admin...');
            const hashedPassword = await bcrypt.hash('Mandava@1234', 12);

            const adminUser = new User({
                name: 'Administrator',
                email: adminEmail,
                password: hashedPassword,
                mobile: '0000000000',
                isAdmin: true,
                status: 'Active',
                subscription: { tier: 'Business', aiCredits: Infinity },
            });

            await adminUser.save();
            console.log('Default admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error ensuring admin user exists:', error);
        process.exit(1);
    }
};


mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("Successfully connected to MongoDB Atlas!");
        ensureAdminUserExists();
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB Atlas:", err);
        process.exit(1);
    });

// --- API Routes ---
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: 'online', message: 'Ajo AI Backend Server is running!' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/chatbots', require('./routes/chatbots'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/profile', require('./routes/profile'));


// --- Server Startup ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});