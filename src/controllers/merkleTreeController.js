"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MerkleTreee_1 = __importDefault(require("../models/MerkleTreee"));
const merkleTreeService_1 = require("../services/merkleTreeService");
const router = express_1.default.Router();
//POST
router.post('/generate-merkle-tree', async (req, res) => {
    const { symbol, to, chainId } = req.body;
    try {
        const existingMerkleTree = await MerkleTreee_1.default.findOne({
            token: symbol,
            contractAddress: to,
        });
        if (existingMerkleTree) {
            return res
                .status(400)
                .json({
                error: 'Merkle tree already exists for the specified token and contractAddress',
            });
        }
        await (0, merkleTreeService_1.generateMerkleTree)(symbol, to, chainId);
        res.status(200).json({ message: 'Merkle tree generated successfully' });
    }
    catch (error) {
        console.error('Error generating Merkle tree:', error);
        res
            .status(500)
            .json({ error: 'An error occurred while generating the Merkle tree' });
    }
});
//GET
router.get('/merkle-tree', async (req, res) => {
    const { token, contractAddress } = req.query;
    if (!token || !contractAddress) {
        return res
            .status(400)
            .json({ error: 'Token and contractAddress are required parameters' });
    }
    try {
        const merkleTree = await MerkleTreee_1.default.findOne({
            token,
            contractAddress,
        }).lean();
        if (!merkleTree) {
            return res
                .status(404)
                .json({
                error: 'Merkle tree data not found for the specified token and contractAddress',
            });
        }
        res.status(200).json(merkleTree);
    }
    catch (error) {
        console.error('Error fetching Merkle tree data:', error);
        res
            .status(500)
            .json({ error: 'An error occurred while fetching the Merkle tree data' });
    }
});
exports.default = router;
