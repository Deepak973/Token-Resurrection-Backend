"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const merkleTree = {
    AAVE: './js-scripts/maps/aaveRescueMerkleTree.json',
    STK_AAVE: './js-scripts/maps/stkAaveRescueMerkleTree.json',
    USDT: './js-scripts/maps/usdtRescueMerkleTree.json',
    UNI: './js-scripts/maps/uniRescueMerkleTree.json',
};
const distributionIds = {
    AAVE: 0,
    STK_AAVE: 1,
    USDT: 2,
    UNI: 3,
};
const getMerkleTreeJson = (path) => {
    try {
        const file = fs_1.default.readFileSync(path);
        // @ts-ignore
        return JSON.parse(file);
    }
    catch (error) {
        console.error(new Error(`unable to fetch ${path} with error: ${error}`));
        return {};
    }
};
const generateUsersJson = () => {
    const usersJson = {};
    const lightUsersJson = {};
    for (const token of Object.keys(merkleTree)) {
        const merkleTreeJson = getMerkleTreeJson(merkleTree[token]);
        for (const claimer of Object.keys(merkleTreeJson.claims)) {
            if (!usersJson[claimer]) {
                usersJson[claimer] = [];
            }
            if (!lightUsersJson[claimer]) {
                lightUsersJson[claimer] = {};
            }
            const claimerInfo = merkleTreeJson.claims[claimer];
            lightUsersJson[claimer][token] = claimerInfo.amount;
            usersJson[claimer].push({
                tokenAmount: claimerInfo.amount,
                tokenAmountInWei: claimerInfo.amountInWei,
                proof: claimerInfo.proof,
                index: claimerInfo.index,
                distributionId: distributionIds[token],
            });
        }
    }
    fs_1.default.writeFileSync('./js-scripts/maps/usersMerkleTrees.json', JSON.stringify(usersJson));
    fs_1.default.writeFileSync('./js-scripts/maps/usersAmounts.json', JSON.stringify(lightUsersJson));
};
generateUsersJson();
