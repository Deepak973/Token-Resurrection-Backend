"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveTransactionData = exports.generateAndSaveMap = exports.fetchTxns = exports.TOKENS = void 0;
const ethers_1 = require("ethers");
const IERC20__factory_1 = require("./typechain/IERC20__factory");
const contract_helpers_1 = require("@aave/contract-helpers");
const label_map_1 = require("./label-map");
const parse_balance_map_1 = require("./parse-balance-map");
const MerkleTreee_1 = __importDefault(require("../models/MerkleTreee"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const JSON_RPC_PROVIDER = {
    [contract_helpers_1.ChainId.mainnet]: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
};
//usdc,dai,weth,uni
exports.TOKENS = {
    // LEND: '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03', 
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
};
//usdc,dai,weth,uni
async function fetchTxns(symbol, to, network, name, validateEvent) {
    const token = exports.TOKENS[symbol];
    console.log('1');
    const provider = new ethers_1.providers.StaticJsonRpcProvider(JSON_RPC_PROVIDER[contract_helpers_1.ChainId.mainnet]);
    console.log('provider', provider);
    const contract = IERC20__factory_1.IERC20__factory.connect(token, provider);
    const event = contract.filters.Transfer(null, to);
    console.log('2');
    async function getPastLogs(fromBlock, toBlock) {
        if (fromBlock <= toBlock) {
            try {
                const events = await contract.queryFilter(event, fromBlock, toBlock);
                console.log('3');
                return events;
            }
            catch (error) {
                // @ts-expect-error
                if (error.error?.message?.indexOf('[') > -1) {
                    // alchemy specific solution, that optimizes, taking into account
                    // alchemy error information
                    // @ts-expect-error
                    const { 0: newFromBlock, 1: newToBlock } = error.error.message
                        .split('[')[1]
                        .split(']')[0]
                        .split(', ');
                    console.log(contract.address, '4 Error code: ', 
                    // @ts-expect-error
                    error.error?.code, ' fromBloc: ', Number(newFromBlock), ' toBlock: ', Number(newToBlock));
                    const arr1 = await getPastLogs(Number(newFromBlock), Number(newToBlock));
                    const arr2 = await getPastLogs(Number(newToBlock) + 1, toBlock);
                    return [...arr1, ...arr2];
                }
                else {
                    // solution that will work with generic rpcs or
                    // if alchemy fails with different error
                    const midBlock = (fromBlock + toBlock) >> 1;
                    const arr1 = await getPastLogs(fromBlock, midBlock);
                    const arr2 = await getPastLogs(midBlock + 1, toBlock);
                    return [...arr1, ...arr2];
                }
            }
        }
        return [];
    }
    const currentBlockNumber = await provider.getBlockNumber();
    let events = await getPastLogs(0, currentBlockNumber);
    if (validateEvent)
        events = await validateEvent(events);
    const addressValueMap = {};
    let totalValue = ethers_1.BigNumber.from(0);
    let latestBlockNumber = 0;
    events.forEach((e) => {
        if (e.args) {
            let value = ethers_1.BigNumber.from(e.args.value.toString());
            if (value.gt(0)) {
                if (e.blockNumber >= latestBlockNumber) {
                    latestBlockNumber = e.blockNumber;
                }
                totalValue = totalValue.add(value);
                // if (symbol === 'LEND') {
                //     value = BigNumber.from(e.args.value.toString()).div(100);
                // }
                if (addressValueMap[e.args.from]) {
                    const aggregatedValue = value
                        .add(ethers_1.BigNumber.from(addressValueMap[e.args.from].amount))
                        .toString();
                    addressValueMap[e.args.from].amount = aggregatedValue;
                    addressValueMap[e.args.from].txHash.push(e.transactionHash);
                }
                else {
                    addressValueMap[e.args.from] = {
                        amount: value.toString(),
                        txHash: [e.transactionHash],
                    };
                }
            }
        }
    });
    console.log(`Total amount for ${name} in wei: ${totalValue} ${symbol} latestBlock: ${latestBlockNumber}`);
    return addressValueMap;
}
exports.fetchTxns = fetchTxns;
async function generateAndSaveMap(mappedContract, symbol, decimals, to) {
    const aggregatedMapping = {};
    const labels = require('./labels/labels.json');
    for (let address of Object.keys(mappedContract)) {
        if (aggregatedMapping[address]) {
            const aggregatedValue = ethers_1.BigNumber.from(mappedContract[address].amount.toString())
                .add(aggregatedMapping[address].amount)
                .toString();
            aggregatedMapping[address].amount = aggregatedValue;
            aggregatedMapping[address].txns = [
                ...aggregatedMapping[address].txns,
                ...mappedContract[address].txHash,
            ];
        }
        else {
            aggregatedMapping[address] = {};
            aggregatedMapping[address].amount =
                mappedContract[address].amount.toString();
            aggregatedMapping[address].txns = [...mappedContract[address].txHash];
            const label = await (0, label_map_1.fetchLabel)(address, labels);
            if (label) {
                aggregatedMapping[address].label = label;
            }
        }
    }
    console.log(`Aggregated mapping for ${symbol}:`, aggregatedMapping);
    const merkleTree = (0, parse_balance_map_1.parseBalanceMap)(aggregatedMapping, decimals, symbol);
    console.log(`Merkle tree for ${symbol}:`, JSON.stringify(merkleTree, null, 2));
    const tree = new MerkleTreee_1.default({
        token: symbol,
        contractAddress: to,
        merkleRoot: merkleTree.merkleRoot,
        tokenTotal: merkleTree.tokenTotal,
        tokenTotalInWei: merkleTree.tokenTotalInWei,
        claims: merkleTree.claims,
    });
    await tree.save();
    const claims = merkleTree.claims;
    for (const address in claims) {
        const claim = claims[address];
        const user = await User_1.default.findOneAndUpdate({ address }, {
            $addToSet: {
                tokens: {
                    symbol,
                    contractAddress: to,
                    amount: claim.amount,
                    amountInWei: claim.amountInWei
                }
            }
        }, { upsert: true, new: true });
        await user.save();
    }
}
exports.generateAndSaveMap = generateAndSaveMap;
async function saveTransactionData(mappedContract, symbol, to) {
    for (const [address, data] of Object.entries(mappedContract)) {
        const transaction = new Transaction_1.default({
            from: address,
            amount: data.amount,
            txHash: data.txHash,
            token: symbol,
            to: to,
        });
        await transaction.save();
    }
}
exports.saveTransactionData = saveTransactionData;
