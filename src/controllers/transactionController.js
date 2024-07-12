"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Proposal_1 = __importDefault(require("../models/Proposal"));
const ethers_1 = require("ethers");
const merkleTreeService_1 = require("../services/merkleTreeService");
const router = express_1.default.Router();
const getTransactionsByTokenAndTo = async (token, to) => {
    const transactions = await Transaction_1.default.find({ token, to });
    let totalAmount = ethers_1.BigNumber.from(0);
    const results = transactions.map((transaction) => {
        totalAmount = totalAmount.add(ethers_1.BigNumber.from(transaction.amount));
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
router.get('/transactions', async (req, res) => {
    const { token, to } = req.query;
    try {
        if (!token || !to) {
            return res
                .status(200)
                .json({ error: 'Token and to address are required' });
        }
        const result = await getTransactionsByTokenAndTo(token, to);
        if (result.transactions.length === 0) {
            return res.status(200).json({
                message: 'No transactions found for the given token and to address',
            });
        }
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res
            .status(500)
            .json({ error: 'An error occurred while fetching the transactions' });
    }
});
// Create transactions by token and to address
router.post('/transactions', async (req, res) => {
    const { token, to, chainId } = req.body;
    try {
        if (!token || !to) {
            return res
                .status(200)
                .json({ error: 'Token and to address are required' });
        }
        // Check if transactions already exist for the given token and to address
        const existingTransactions = await Transaction_1.default.find({ token, to, chainId });
        if (existingTransactions.length > 0) {
            const result = await getTransactionsByTokenAndTo(token, to);
            return res.status(200).json({
                message: 'Transactions already present',
                ...result,
            });
        }
        console.log('chain ID', chainId);
        // Fetch and save transactions
        await (0, merkleTreeService_1.generateTransactions)(token, to, chainId);
        // Retrieve and return the saved transactions
        const result = await getTransactionsByTokenAndTo(token, to);
        res.status(200).json({
            message: 'Transactions created successfully',
            ...result,
        });
    }
    catch (error) {
        console.error('Error creating transactions:', error);
        res
            .status(500)
            .json({ error: 'An error occurred while creating the transactions' });
    }
});
// Get transactions by user address
// router.get('/user-transactions', async (req: Request, res: Response) => {
//   const { user } = req.query;
//   try {
//     if (!user) {
//       return res.status(200).json({ error: 'User address is required' });
//     }
//     const transactions = await Transaction.find({ from: user });
//     if (transactions.length === 0) {
//       return res
//         .status(200)
//         .json({ message: 'No transactions found for the given user address' });
//     }
//     const aggregatedTransactions = transactions.reduce((acc, transaction) => {
//       const key = `${transaction.token}-${transaction.to}`;
//       if (!acc[key]) {
//         acc[key] = BigNumber.from(0);
//       }
//       acc[key] = acc[key].add(BigNumber.from(transaction.amount));
//       return acc;
//     }, {} as Record<string, BigNumber>);
//     const results = Object.keys(aggregatedTransactions).map((key) => {
//       const [token, to] = key.split('-');
//       return {
//         token,
//         to,
//         totalAmount: aggregatedTransactions[key].toString(),
//       };
//     });
//     res.status(200).json(results);
//   } catch (error) {
//     console.error('Error fetching user transactions:', error);
//     res
//       .status(500)
//       .json({
//         error: 'An error occurred while fetching the user transactions',
//       });
//   }
// });
router.get('/user-transactions', async (req, res) => {
    const { user } = req.query;
    try {
        if (!user) {
            return res.status(201).json({ error: 'User address is required' });
        }
        const transactions = await Transaction_1.default.find({ from: user });
        if (transactions.length === 0) {
            return res
                .status(201)
                .json({ message: 'No Attestation or Claims Available at the moment' });
        }
        const aggregatedTransactions = transactions.reduce((acc, transaction) => {
            const key = `${transaction.token}-${transaction.to}`;
            if (!acc[key]) {
                acc[key] = ethers_1.BigNumber.from(0);
            }
            acc[key] = acc[key].add(ethers_1.BigNumber.from(transaction.amount));
            return acc;
        }, {});
        const results = await Promise.all(Object.keys(aggregatedTransactions).map(async (key) => {
            const [token, to] = key.split('-');
            const totalAmount = aggregatedTransactions[key].toString();
            // Find the matching proposal
            const proposal = await Proposal_1.default.findOne({
                tokenName: token,
                contractAddress: to,
            });
            if (proposal) {
                return {
                    token,
                    to,
                    totalAmount,
                    schemUid: proposal.schemUid,
                    addresses: proposal.addresses,
                };
            }
            else {
                return {
                    token,
                    to,
                    totalAmount,
                };
            }
        }));
        res.status(200).json(results);
    }
    catch (error) {
        console.error('Error fetching user transactions:', error);
        res.status(500).json({
            error: 'An error occurred while fetching the user transactions',
        });
    }
});
exports.default = router;
