"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
//User api
router.get('/user', async (req, res) => {
    const { address } = req.query;
    if (!address) {
        return res.status(200).json({ error: 'Address parameter is required' });
    }
    try {
        const user = await User_1.default.findOne({ address }).lean();
        if (!user) {
            return res
                .status(200)
                .json({ error: 'No Attestation or Claims found for the address' });
        }
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        res
            .status(500)
            .json({ error: 'An error occurred while fetching user data' });
    }
});
exports.default = router;
