"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTransactions = exports.generateMerkleTree = void 0;
const generate_address_value_with_tree_1 = require("../js-scripts/generate-address-value-with-tree");
const contract_helpers_1 = require("@aave/contract-helpers");
//usdc,dai,weth,uni
const getDecimalsForToken = (symbol) => {
    switch (symbol.toUpperCase()) {
        case 'USDC':
            return 6;
        default:
            return 18;
    }
};
const generateMerkleTree = async (symbol, to, chainId) => {
    let chain;
    switch (chainId) {
        case contract_helpers_1.ChainId.optimism:
            chain = contract_helpers_1.ChainId.optimism;
            break;
        case contract_helpers_1.ChainId.mainnet:
            chain = contract_helpers_1.ChainId.mainnet;
            break;
        default:
            throw new Error(`Unsupported chainId: ${chainId}`);
    }
    const mappedContract = await (0, generate_address_value_with_tree_1.fetchTxns)(symbol, to, chain);
    const decimals = getDecimalsForToken(symbol);
    await (0, generate_address_value_with_tree_1.generateAndSaveMap)(mappedContract, symbol, decimals, to);
};
exports.generateMerkleTree = generateMerkleTree;
const generateTransactions = async (symbol, to, chainId) => {
    let chain;
    switch (chainId) {
        case contract_helpers_1.ChainId.optimism:
            chain = contract_helpers_1.ChainId.optimism;
            break;
        case contract_helpers_1.ChainId.mainnet:
            chain = contract_helpers_1.ChainId.mainnet;
            break;
        default:
            throw new Error(`Unsupported chainId: ${chainId}`);
    }
    console.log('the chain is', chain);
    const mappedContract = await (0, generate_address_value_with_tree_1.fetchTxns)(symbol, to, chain);
    await (0, generate_address_value_with_tree_1.saveTransactionData)(mappedContract, symbol, to, chainId);
    return mappedContract;
};
exports.generateTransactions = generateTransactions;
