import { StellarWalletsKit, WalletNetwork, FREIGHTER_ID, FreighterModule } from '@creit.tech/stellar-wallets-kit';
import * as StellarSdk from '@stellar/stellar-sdk';

export const kit = new StellarWalletsKit({
  network: (process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? WalletNetwork.PUBLIC
    : WalletNetwork.TESTNET),
  selectedWalletId: FREIGHTER_ID,
  modules: [new FreighterModule()],
});

export const getPublicKey = async (): Promise<string> => {
  const { address } = await kit.getAddress();
  return address;
};

const server = new StellarSdk.Horizon.Server(
  process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org'
);

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? '';

export const buyTokens = async (publicKey: string, launchId: string, xlmAmount: number): Promise<string> => {
  const account = await server.loadAccount(publicKey);
  const fee = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: String(fee),
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'buy',
        args: [
          StellarSdk.nativeToScVal(launchId, { type: 'string' }),
          StellarSdk.nativeToScVal(Math.floor(xlmAmount * 1e7), { type: 'i128' }),
        ],
      })
    )
    .setTimeout(30)
    .build();

  const { signedTxXdr } = await kit.signTransaction(tx.toXDR());
  const result = await server.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.TESTNET));
  return result.hash;
};

export const sellTokens = async (publicKey: string, launchId: string, tokenAmount: number): Promise<string> => {
  const account = await server.loadAccount(publicKey);
  const fee = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: String(fee),
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'sell',
        args: [
          StellarSdk.nativeToScVal(launchId, { type: 'string' }),
          StellarSdk.nativeToScVal(Math.floor(tokenAmount * 1e7), { type: 'i128' }),
        ],
      })
    )
    .setTimeout(30)
    .build();

  const { signedTxXdr } = await kit.signTransaction(tx.toXDR());
  const result = await server.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.TESTNET));
  return result.hash;
};

export const createLaunchTx = async (
  publicKey: string,
  params: { name: string; symbol: string; totalSupply: number; targetMarketCap: number }
): Promise<string> => {
  const account = await server.loadAccount(publicKey);
  const fee = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: String(fee),
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'create_launch',
        args: [
          StellarSdk.nativeToScVal(params.name, { type: 'string' }),
          StellarSdk.nativeToScVal(params.symbol, { type: 'string' }),
          StellarSdk.nativeToScVal(Math.floor(params.totalSupply * 1e7), { type: 'i128' }),
          StellarSdk.nativeToScVal(Math.floor(params.targetMarketCap * 1e7), { type: 'i128' }),
        ],
      })
    )
    .setTimeout(30)
    .build();

  const { signedTxXdr } = await kit.signTransaction(tx.toXDR());
  const result = await server.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.TESTNET));
  return result.hash;
};
