"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const merkleTreeController_1 = __importDefault(require("./controllers/merkleTreeController"));
const proposalController_1 = __importDefault(require("./controllers/proposalController"));
const userController_1 = __importDefault(require("./controllers/userController"));
const transactionController_1 = __importDefault(require("./controllers/transactionController"));
const database_1 = __importDefault(require("./config/database"));
const cors = require('cors');
dotenv_1.default.config();
const app = (0, express_1.default)();
// const corsOptions = {
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// };
// app.options('*', cors(corsOptions));
// app.use(cors(corsOptions));
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://token-resurrection.vercel.app',
        'http://localhost:3000',
    ]; // Add your frontend URLs
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.removeHeader('x-powered-by');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use((req, res, next) => {
    res.setTimeout(120000); // 2 minutes
    next();
});
const port = process.env.PORT || 3000;
app.use(body_parser_1.default.json());
// Connect to MongoDB
(0, database_1.default)();
// Define routes
app.use('/api', merkleTreeController_1.default);
app.use('/api', proposalController_1.default);
app.use('/api', transactionController_1.default);
app.use('/api', userController_1.default);
app.get('/', async (req, res) => {
    res.json({ message: 'it is working' });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
