import express, { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import { BigNumber } from 'ethers';
import { generateTransactions } from '../services/merkleTreeService';
const router = express.Router();

const getTransactionsByTokenAndTo = async (token: string, to: string) => {
  const transactions = await Transaction.find({ token, to });
  let totalAmount = BigNumber.from(0);

  const results = transactions.map((transaction) => {
    totalAmount = totalAmount.add(BigNumber.from(transaction.amount));
    return {
      from: transaction.from,
      amount: transaction.amount,
    };
  });

  return {
    transactions: results,
    totalAmount: totalAmount.toString(),
  };
};

// Get transactions by token and to address
router.get('/transactions', async (req: Request, res: Response) => {
  const { token, to } = req.query;

  try {
    if (!token || !to) {
      return res
        .status(200)
        .json({ error: 'Token and to address are required' });
    }

    const result = await getTransactionsByTokenAndTo(
      token as string,
      to as string,
    );

    if (result.transactions.length === 0) {
      return res
        .status(200)
        .json({
          message: 'No transactions found for the given token and to address',
        });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching the transactions' });
  }
});

// Create transactions by token and to address
router.post('/transactions', async (req: Request, res: Response) => {
  const { token, to } = req.body;

  try {
    if (!token || !to) {
      return res
        .status(200)
        .json({ error: 'Token and to address are required' });
    }

    // Check if transactions already exist for the given token and to address
    const existingTransactions = await Transaction.find({ token, to });

    if (existingTransactions.length > 0) {
      const result = await getTransactionsByTokenAndTo(token, to);
      return res.status(200).json({
        message: 'Transactions already present',
        ...result,
      });
    }

    // Fetch and save transactions
    await generateTransactions(token, to);

    // Retrieve and return the saved transactions
    const result = await getTransactionsByTokenAndTo(token, to);
    res.status(201).json({
      message: 'Transactions created successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error creating transactions:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while creating the transactions' });
  }
});

// Get transactions by user address
router.get('/user-transactions', async (req: Request, res: Response) => {
  const { user } = req.query;

  try {
    if (!user) {
      return res.status(200).json({ error: 'User address is required' });
    }

    const transactions = await Transaction.find({ from: user });

    if (transactions.length === 0) {
      return res
        .status(200)
        .json({ message: 'No transactions found for the given user address' });
    }

    const aggregatedTransactions = transactions.reduce((acc, transaction) => {
      const key = `${transaction.token}-${transaction.to}`;
      if (!acc[key]) {
        acc[key] = BigNumber.from(0);
      }
      acc[key] = acc[key].add(BigNumber.from(transaction.amount));
      return acc;
    }, {} as Record<string, BigNumber>);

    const results = Object.keys(aggregatedTransactions).map((key) => {
      const [token, to] = key.split('-');
      return {
        token,
        to,
        totalAmount: aggregatedTransactions[key].toString(),
      };
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res
      .status(500)
      .json({
        error: 'An error occurred while fetching the user transactions',
      });
  }
});

export default router;
