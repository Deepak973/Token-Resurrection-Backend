import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import merkleTreeController from './controllers/merkleTreeController';
import proposalController from './controllers/proposalController';
import userController from './controllers/userController';
import transactionController from './controllers/transactionController';
import connectDB from './config/database';
const cors = require('cors');

dotenv.config();

const app = express();

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
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
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

app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Define routes
app.use('/api', merkleTreeController);
app.use('/api', proposalController);
app.use('/api', transactionController);
app.use('/api', userController);
app.get('/', async (req, res) => {
  res.json({ message: 'it is working' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
