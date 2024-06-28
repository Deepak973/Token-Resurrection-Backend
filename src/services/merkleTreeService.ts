import { TOKENS, fetchTxns, generateAndSaveMap, saveTransactionData } from '../js-scripts/generate-address-value-with-tree';
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

const generateMerkleTree = async (symbol: keyof typeof TOKENS, to: string) => {
  const mappedContract = await fetchTxns(symbol, to, ChainId.mainnet, `${symbol}-${to}`);
  const decimals = getDecimalsForToken(symbol);
  await generateAndSaveMap(mappedContract, symbol, decimals, to);
};
const generateTransactions  = async (symbol: keyof typeof TOKENS, to: string) => {
  const mappedContract = await fetchTxns(symbol, to, ChainId.mainnet, `${symbol}-${to}`);
  await saveTransactionData(mappedContract, symbol, to);
  return mappedContract;

};
export { generateMerkleTree, generateTransactions };
