import { BigNumber, Event, providers } from 'ethers';
import { IERC20__factory } from './typechain/IERC20__factory';
import { ChainId } from '@aave/contract-helpers';
import { fetchLabel } from './label-map';
import { parseBalanceMap } from './parse-balance-map';
import MerkleTree from "../models/MerkleTreee"
import Transaction from "../models/Transaction";
import dotenv from 'dotenv';
import User from '../models/User';
dotenv.config();


const JSON_RPC_PROVIDER = {
    [ChainId.mainnet]: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
};
//usdc,dai,weth,uni
export const TOKENS = {
    // LEND: '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03', 
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
};
//usdc,dai,weth,uni

export async function fetchTxns(
    symbol: keyof typeof TOKENS,
    to: string,
    network?: keyof typeof JSON_RPC_PROVIDER,
    name?: string,
    validateEvent?: (events: Event[]) => Promise<Event[]>,
): Promise<Record<string, { amount: string; txHash: string[] }>> {
    const token = TOKENS[symbol];
    console.log('1');
    const provider = new providers.StaticJsonRpcProvider(
        JSON_RPC_PROVIDER[ChainId.mainnet],
    );
    console.log('provider', provider);
    const contract = IERC20__factory.connect(token, provider);
    const event = contract.filters.Transfer(null, to);
    console.log('2');
    async function getPastLogs(
        fromBlock: number,
        toBlock: number,
    ): Promise<Event[]> {
        if (fromBlock <= toBlock) {
            try {
                const events = await contract.queryFilter(event, fromBlock, toBlock);
                console.log('3');
                return events;
            } catch (error) {
                // @ts-expect-error

                if (error.error?.message?.indexOf('[') > -1) {
                    // alchemy specific solution, that optimizes, taking into account
                    // alchemy error information
                    // @ts-expect-error
                    const { 0: newFromBlock, 1: newToBlock } = error.error.message
                        .split('[')[1]
                        .split(']')[0]
                        .split(', ');

                    console.log(
                        contract.address,
                        '4 Error code: ',
                        // @ts-expect-error
                        error.error?.code,
                        ' fromBloc: ',
                        Number(newFromBlock),
                        ' toBlock: ',
                        Number(newToBlock),
                    );

                    const arr1 = await getPastLogs(
                        Number(newFromBlock),
                        Number(newToBlock),
                    );
                    const arr2 = await getPastLogs(Number(newToBlock) + 1, toBlock);
                    return [...arr1, ...arr2];
                } else {
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
    if (validateEvent) events = await validateEvent(events);

    const addressValueMap: Record<string, { amount: string; txHash: string[] }> =
        {};
    let totalValue = BigNumber.from(0);
    let latestBlockNumber = 0;
    events.forEach((e: Event) => {
        if (e.args) {
            let value = BigNumber.from(e.args.value.toString());
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
                        .add(BigNumber.from(addressValueMap[e.args.from].amount))
                        .toString();
                    addressValueMap[e.args.from].amount = aggregatedValue;
                    addressValueMap[e.args.from].txHash.push(e.transactionHash);
                } else {
                    addressValueMap[e.args.from] = {
                        amount: value.toString(),
                        txHash: [e.transactionHash],
                    };
                }
            }
        }
    });

    console.log(
        `Total amount for ${name} in wei: ${totalValue} ${symbol} latestBlock: ${latestBlockNumber}`,
    );

    return addressValueMap;
}


export async function generateAndSaveMap(
    mappedContract: Record<string, { amount: string; txHash: string[] }>,
    symbol: string,
    decimals: number,
    to: String
): Promise<void> {
    const aggregatedMapping: Record<
        string,
        { amount: string; txns: string[]; label?: string }
    > = {};
    const labels = require('./labels/labels.json');
    for (let address of Object.keys(mappedContract)) {
        if (aggregatedMapping[address]) {
            const aggregatedValue = BigNumber.from(
                mappedContract[address].amount.toString(),
            )
                .add(aggregatedMapping[address].amount)
                .toString();
            aggregatedMapping[address].amount = aggregatedValue;
            aggregatedMapping[address].txns = [
                ...aggregatedMapping[address].txns,
                ...mappedContract[address].txHash,
            ];
        } else {
            aggregatedMapping[address] = {} as any;
            aggregatedMapping[address].amount =
                mappedContract[address].amount.toString();
            aggregatedMapping[address].txns = [...mappedContract[address].txHash];
            const label = await fetchLabel(address, labels);
            if (label) {
                aggregatedMapping[address].label = label;
            }
        }
    }

    console.log(`Aggregated mapping for ${symbol}:`, aggregatedMapping);

    const merkleTree = parseBalanceMap(aggregatedMapping, decimals, symbol);
    console.log(`Merkle tree for ${symbol}:`, JSON.stringify(merkleTree, null, 2));

    const tree = new MerkleTree({
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
        const user = await User.findOneAndUpdate(
            { address },
            {
                $addToSet: {
                    tokens: {
                        symbol,
                        contractAddress: to,
                        amount: claim.amount,
                        amountInWei: claim.amountInWei
                    }
                }
            },
            { upsert: true, new: true }
        );
        await user.save();
    }

}


export async function saveTransactionData(
    mappedContract: Record<string, { amount: string; txHash: string[] }>,
    symbol: string,
    to: String
): Promise<void> {
    for (const [address, data] of Object.entries(mappedContract)) {
        const transaction = new Transaction({
            from: address,
            amount: data.amount,
            txHash: data.txHash,
            token: symbol,
            to: to,
        });
        await transaction.save();
    }
}
