import {
  TOKENS,
  fetchTxns,
  generateAndSaveMap,
  saveTransactionData,
} from '../js-scripts/generate-address-value-with-tree';
import { ChainId } from '@aave/contract-helpers';

//usdc,dai,weth,uni
const getDecimalsForToken = (symbol: string): number => {
  switch (symbol.toUpperCase()) {
    case 'USDC':
      return 6;
    default:
      return 18;
  }
};

const generateMerkleTree = async (
  symbol: keyof typeof TOKENS,
  to: string,
  chainId: number,
) => {
  let chain: ChainId.mainnet | ChainId.optimism;

  switch (chainId) {
    case ChainId.optimism:
      chain = ChainId.optimism;
      break;
    case ChainId.mainnet:
      chain = ChainId.mainnet;
      break;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
  const mappedContract = await fetchTxns(symbol, to, chain);
  const decimals = getDecimalsForToken(symbol);
  await generateAndSaveMap(mappedContract, symbol, decimals, to);
};
const generateTransactions = async (
  symbol: keyof typeof TOKENS,
  to: string,
  chainId: number,
) => {
  let chain: ChainId.mainnet | ChainId.optimism;

  switch (chainId) {
    case ChainId.optimism:
      chain = ChainId.optimism;
      break;
    case ChainId.mainnet:
      chain = ChainId.mainnet;
      break;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
  console.log('the chain is', chain);
  const mappedContract = await fetchTxns(symbol, to, chain);
  await saveTransactionData(mappedContract, symbol, to, chainId);
  return mappedContract;
};
export { generateMerkleTree, generateTransactions };
