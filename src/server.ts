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

const corsOptions = {
  origin: 'https://token-resurrection.vercel.app',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
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
