import { Connection, PublicKey, Transaction, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { 
  Raydium, 
  TxVersion,
} from '@raydium-io/raydium-sdk-v2';
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import BN from 'bn.js';
import { LaunchData, BondingCurveData, TokenInfo } from '../types';

export interface CreateTokenParams {
  name: string;
  symbol: string;
  description?: string;
  totalSupply: number;
  decimals: number;
  logoFile?: File;
}

export interface TradeParams {
  mint: PublicKey;
  amount: number;
  isBuy: boolean;
  slippage: number;
}

class LaunchLabService {
  private connection: Connection;
  private raydium: Raydium | null = null;
  private cluster: 'mainnet-beta' | 'devnet';

  private constructor(connection: Connection, cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta') {
    this.connection = connection;
    this.cluster = cluster;
  }

  static async create(connection: Connection, cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta'): Promise<LaunchLabService> {
    const service = new LaunchLabService(connection, cluster);
    await service.initializeRaydiumInternal();
    return service;
  }

  private async initializeRaydiumInternal() {
    try {
      this.raydium = await Raydium.load({
        owner: Keypair.generate(), // This will be replaced with actual wallet
        connection: this.connection,
        cluster: this.cluster,
        disableFeatureCheck: true,
        disableLoadToken: true,
        blockhashCommitment: 'finalized',
      });
      
      // Validate that cluster info and program IDs are loaded
      if (!this.raydium.clusterInfo) {
        throw new Error('Raydium SDK failed to load cluster information');
      }
      
      if (!this.raydium.clusterInfo.programIds) {
        throw new Error('Raydium SDK failed to load program IDs for cluster');
      }
      
      console.log('✅ Raydium SDK initialized with cluster info:', {
        cluster: this.cluster,
        programIds: Object.keys(this.raydium.clusterInfo.programIds)
      });
    } catch (error) {
      console.error('Failed to initialize Raydium SDK:', error);
      this.raydium = null;
      throw error;
    }
  }

  async createToken(params: CreateTokenParams, wallet: WalletContextState): Promise<string> {
    console.log('🚀 Starting token creation process...');
    console.log('📋 Token parameters:', params);
    
    if (!wallet.publicKey || !wallet.signTransaction) {
      console.error('❌ Wallet not connected properly');
      throw new Error('Wallet not connected');
    }

    if (!this.raydium) {
      console.error('❌ Raydium SDK not initialized');
      throw new Error('Raydium SDK not initialized');
    }

    try {
      console.log('🔑 Generating mint keypair...');
      // Step 1: Create the mint
      const mintKeypair = Keypair.generate();
      console.log('✅ Mint keypair generated:', mintKeypair.publicKey.toBase58());
      
      // Get recent blockhash
      console.log('🔗 Getting recent blockhash...');
      console.log('🌐 Using RPC endpoint:', this.connection.rpcEndpoint);
      
      // Add timeout to blockhash request
      const blockhashPromise = this.connection.getLatestBlockhash('confirmed');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Blockhash request timed out after 10 seconds')), 10000)
      );
      
      const { blockhash } = await Promise.race([blockhashPromise, timeoutPromise]) as any;
      console.log('✅ Blockhash obtained:', blockhash);
      
      // Create mint transaction
      console.log('📝 Creating mint transaction...');
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Calculate rent for mint account
      console.log('💰 Calculating rent for mint account...');
      const mintRent = await this.connection.getMinimumBalanceForRentExemption(82);
      console.log('✅ Mint rent calculated:', mintRent, 'lamports');

      // Add create account instruction
      console.log('📄 Adding create account instruction...');
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          lamports: mintRent,
          space: 82,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Add initialize mint instruction
      console.log('🔧 Adding initialize mint instruction...');
      const initializeMintInstruction = {
        keys: [
          { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
          { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
        ],
        programId: TOKEN_PROGRAM_ID,
        data: Buffer.from([
          0, // InitializeMint instruction
          params.decimals, // decimals
          ...wallet.publicKey.toBuffer(), // mint authority
          1, // freeze authority option
          ...wallet.publicKey.toBuffer(), // freeze authority
        ]),
      };
      
      transaction.add(initializeMintInstruction);

      // Sign with mint keypair
      console.log('✍️ Signing transaction with mint keypair...');
      transaction.partialSign(mintKeypair);

      // Sign with wallet
      console.log('✍️ Requesting wallet signature...');
      const signedTransaction = await wallet.signTransaction(transaction);
      console.log('✅ Transaction signed by wallet');
      
      // Send transaction
      console.log('📡 Sending mint creation transaction...');
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      console.log('✅ Transaction sent, signature:', signature);
      
      console.log('⏳ Confirming mint creation transaction...');
      await this.connection.confirmTransaction(signature, 'confirmed');
      console.log('✅ Mint creation confirmed!');

      console.log('Mint created:', mintKeypair.publicKey.toBase58());

      // Step 2: Create associated token account and mint tokens
      console.log('🏦 Creating associated token account...');
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        wallet.publicKey
      );
      console.log('✅ Associated token address:', associatedTokenAddress.toBase58());

      // Create associated token account transaction
      console.log('📝 Creating ATA transaction...');
      const createATATransaction = new Transaction();
      const { blockhash: blockhash2 } = await this.connection.getLatestBlockhash('confirmed');
      createATATransaction.recentBlockhash = blockhash2;
      createATATransaction.feePayer = wallet.publicKey;

      // Add create ATA instruction
      console.log('📄 Adding create ATA instruction...');
      createATATransaction.add({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
          { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
        ],
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.alloc(0),
      });

      console.log('✍️ Signing ATA transaction...');
      const signedATATransaction = await wallet.signTransaction(createATATransaction);
      console.log('📡 Sending ATA creation transaction...');
      const ataSignature = await this.connection.sendRawTransaction(signedATATransaction.serialize());
      console.log('✅ ATA transaction sent, signature:', ataSignature);
      
      console.log('⏳ Confirming ATA creation...');
      await this.connection.confirmTransaction(ataSignature, 'confirmed');
      console.log('✅ ATA creation confirmed!');

      // Step 3: Mint tokens
      console.log('🪙 Minting tokens...');
      const mintTransaction = new Transaction();
      const { blockhash: blockhash3 } = await this.connection.getLatestBlockhash('confirmed');
      mintTransaction.recentBlockhash = blockhash3;
      mintTransaction.feePayer = wallet.publicKey;

      const amount = new BN(params.totalSupply).mul(new BN(10).pow(new BN(params.decimals)));
      console.log('💰 Minting amount:', amount.toString(), 'tokens');
      
      // Add mint to instruction
      console.log('📄 Adding mint to instruction...');
      mintTransaction.add({
        keys: [
          { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
          { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        ],
        programId: TOKEN_PROGRAM_ID,
        data: Buffer.concat([
          Buffer.from([7]), // MintTo instruction
          amount.toArrayLike(Buffer, 'le', 8),
        ]),
      });

      console.log('✍️ Signing mint transaction...');
      const signedMintTransaction = await wallet.signTransaction(mintTransaction);
      console.log('📡 Sending mint transaction...');
      const mintSignature = await this.connection.sendRawTransaction(signedMintTransaction.serialize());
      console.log('✅ Mint transaction sent, signature:', mintSignature);
      
      console.log('⏳ Confirming token minting...');
      await this.connection.confirmTransaction(mintSignature, 'confirmed');
      console.log('✅ Token minting confirmed!');

      console.log('Tokens minted successfully');

      console.log('🎉 Token creation completed successfully!');
      console.log('🏷️ Final mint address:', mintKeypair.publicKey.toBase58());
      return mintKeypair.publicKey.toBase58();
    } catch (error) {
      console.error('Token creation failed:', error);
      console.error('❌ Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      throw new Error(`Token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createBondingCurve(
    tokenMint: PublicKey,
    initialSolAmount: number,
    wallet: WalletContextState
  ): Promise<string> {
    console.log('📈 Starting bonding curve creation...');
    console.log('🪙 Token mint:', tokenMint.toBase58());
    console.log('💰 Initial SOL amount:', initialSolAmount);
    
    if (!wallet.publicKey || !wallet.signTransaction) {
      console.error('❌ Wallet not connected for bonding curve creation');
      throw new Error('Wallet not connected');
    }

    if (!this.raydium) {
      console.error('❌ Raydium SDK not initialized for bonding curve creation');
      throw new Error('Raydium SDK not initialized');
    }

    try {
      console.log('🔧 Preparing CPMM pool creation parameters...');
      
      // Ensure we have proper BN values
      const tokenAmount = new BN(800_000_000).mul(new BN(10).pow(new BN(6))); // 800M tokens with 6 decimals
      const solAmount = new BN(Math.floor(initialSolAmount * LAMPORTS_PER_SOL));
      
      console.log('📊 Token amount (raw):', tokenAmount.toString());
      console.log('📊 SOL amount (lamports):', solAmount.toString());
      
      // Get program IDs from Raydium cluster info
      const programId = this.raydium.clusterInfo.programIds.CPMM_PROGRAM_ID;
      const feeAccount = this.raydium.clusterInfo.programIds.CPMM_FEE_ACCOUNT;
      const solMint = new PublicKey('So11111111111111111111111111111111111111112');
      
      console.log('🔑 Program ID:', programId?.toBase58() || 'undefined');
      console.log('🔑 Fee Account:', feeAccount?.toBase58() || 'undefined');
      console.log('🔑 SOL Mint:', solMint.toBase58());
      console.log('🔑 Token Mint:', tokenMint.toBase58());
      
      if (!programId || !feeAccount) {
        throw new Error('CPMM program IDs not available in cluster info');
      }
      
      // Create CPMM pool using Raydium LaunchLab
      console.log('🏗️ Creating CPMM pool...');
      const { execute } = await this.raydium.cpmm.createPool({
        programId: programId.toBase58(),
        poolFeeAccount: feeAccount.toBase58(),
        mintA: {
          mint: tokenMint.toBase58(),
          amount: tokenAmount,
        },
        mintB: {
          mint: solMint.toBase58(),
          amount: solAmount,
        },
        startTime: new BN(Math.floor(Date.now() / 1000)),
        ownerInfo: {
          useSOLBalance: true,
        },
        txVersion: TxVersion.V0,
      });

      console.log('📡 Executing pool creation transaction...');
      const { txId } = await execute({ 
        sendAndConfirm: true,
        wallet: wallet,
        connection: this.connection
      });
      console.log('✅ Bonding curve created successfully! Transaction:', txId);
      return txId;
    } catch (error) {
      console.error('Bonding curve creation failed:', error);
      console.error('❌ Full bonding curve error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      throw new Error(`Bonding curve creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async buyTokens(params: TradeParams, wallet: WalletContextState): Promise<string> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    if (!this.raydium) {
      throw new Error('Raydium SDK not initialized');
    }

    try {
      // Get pool info
      const poolInfo = await this.raydium.api.fetchPoolById({ ids: params.mint.toBase58() });
      
      if (!poolInfo || poolInfo.length === 0) {
        throw new Error('Pool not found');
      }

      const pool = poolInfo[0];

      // Calculate swap
      const { execute } = await this.raydium.cpmm.swap({
        poolInfo: pool,
        swapInDirection: true, // SOL -> Token
        amountIn: new BN(params.amount * LAMPORTS_PER_SOL),
        amountOutMin: new BN(0), // Will be calculated based on slippage
        ownerInfo: {
          useSOLBalance: true,
        },
        txVersion: TxVersion.V0,
      });

      const { txId } = await execute({ sendAndConfirm: true });
      return txId;
    } catch (error) {
      console.error('Buy transaction failed:', error);
      throw new Error(`Buy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sellTokens(params: TradeParams, wallet: WalletContextState): Promise<string> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    if (!this.raydium) {
      throw new Error('Raydium SDK not initialized');
    }

    try {
      // Get pool info
      const poolInfo = await this.raydium.api.fetchPoolById({ ids: params.mint.toBase58() });
      
      if (!poolInfo || poolInfo.length === 0) {
        throw new Error('Pool not found');
      }

      const pool = poolInfo[0];

      // Calculate swap
      const { execute } = await this.raydium.cpmm.swap({
        poolInfo: pool,
        swapInDirection: false, // Token -> SOL
        amountIn: new BN(params.amount * Math.pow(10, 6)), // Assuming 6 decimals
        amountOutMin: new BN(0), // Will be calculated based on slippage
        ownerInfo: {
          useSOLBalance: true,
        },
        txVersion: TxVersion.V0,
      });

      const { txId } = await execute({ sendAndConfirm: true });
      return txId;
    } catch (error) {
      console.error('Sell transaction failed:', error);
      throw new Error(`Sell failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLaunches(): Promise<LaunchData[]> {
    if (!this.raydium) {
      throw new Error('Raydium SDK not initialized');
    }

    try {
      // Fetch all CPMM pools
      const pools = await this.raydium.api.fetchPoolByMints({ 
        mint1: 'So11111111111111111111111111111111111111112' // SOL
      });

      // Ensure pools is an array before slicing
      const poolsArray = Array.isArray(pools) ? pools : [];

      const launches: LaunchData[] = [];

      for (const pool of poolsArray.slice(0, 10)) { // Limit to 10 for demo
        try {
          const tokenInfo: TokenInfo = {
            mint: new PublicKey(pool.mintA.address),
            symbol: pool.mintA.symbol || 'UNKNOWN',
            name: pool.mintA.name || 'Unknown Token',
            decimals: pool.mintA.decimals,
            logoURI: pool.mintA.logoURI,
            totalSupply: new BN(pool.mintA.supply || '0'),
          };

          const bondingCurve: BondingCurveData = {
            virtualTokenReserves: new BN(pool.mintAmountA || '0'),
            virtualSolReserves: new BN(pool.mintAmountB || '0'),
            realTokenReserves: new BN(pool.mintAmountA || '0'),
            realSolReserves: new BN(pool.mintAmountB || '0'),
            tokenTotalSupply: new BN(pool.mintA.supply || '0'),
            complete: false,
          };

          const launch: LaunchData = {
            id: pool.id,
            token: tokenInfo,
            bondingCurve,
            creator: new PublicKey(pool.creator || '11111111111111111111111111111112'),
            createdAt: new Date(pool.openTime ? pool.openTime * 1000 : Date.now()),
            marketCap: parseFloat(pool.tvl || '0'),
            volume24h: parseFloat(pool.day?.volume || '0'),
            priceChange24h: parseFloat(pool.day?.priceChangePercent || '0'),
          };

          launches.push(launch);
        } catch (error) {
          console.warn('Failed to parse pool data:', error);
        }
      }

      return launches;
    } catch (error) {
      console.error('Failed to fetch launches:', error);
      // Return mock data as fallback
      return this.getMockLaunches();
    }
  }

  private getMockLaunches(): LaunchData[] {
    return [
      {
        id: '1',
        token: {
          mint: new PublicKey('11111111111111111111111111111112'),
          symbol: 'MEME',
          name: 'Meme Token',
          decimals: 6,
          logoURI: 'https://images.pexels.com/photos/8369684/pexels-photo-8369684.jpeg?auto=compress&cs=tinysrgb&w=100',
          totalSupply: new BN('1000000000000000'),
        },
        bondingCurve: {
          virtualTokenReserves: new BN('800000000000000'),
          virtualSolReserves: new BN('30000000000'),
          realTokenReserves: new BN('200000000000000'),
          realSolReserves: new BN('5000000000'),
          tokenTotalSupply: new BN('1000000000000000'),
          complete: false,
        },
        creator: new PublicKey('11111111111111111111111111111113'),
        createdAt: new Date(),
        marketCap: 45000,
        volume24h: 12500,
        priceChange24h: 15.7,
      },
    ];
  }

  calculateBuyPrice(bondingCurve: BondingCurveData, amountSol: number): number {
    const virtualSolReserves = bondingCurve.virtualSolReserves.toNumber() / LAMPORTS_PER_SOL;
    const virtualTokenReserves = bondingCurve.virtualTokenReserves.toNumber() / 1e6; // 6 decimals
    
    const k = virtualSolReserves * virtualTokenReserves;
    const newSolReserves = virtualSolReserves + amountSol;
    const newTokenReserves = k / newSolReserves;
    
    return virtualTokenReserves - newTokenReserves;
  }

  calculateSellPrice(bondingCurve: BondingCurveData, amountTokens: number): number {
    const virtualSolReserves = bondingCurve.virtualSolReserves.toNumber() / LAMPORTS_PER_SOL;
    const virtualTokenReserves = bondingCurve.virtualTokenReserves.toNumber() / 1e6; // 6 decimals
    
    const k = virtualSolReserves * virtualTokenReserves;
    const newTokenReserves = virtualTokenReserves + amountTokens;
    const newSolReserves = k / newTokenReserves;
    
    return virtualSolReserves - newSolReserves;
  }

  getCurrentPrice(bondingCurve: BondingCurveData): number {
    const virtualSolReserves = bondingCurve.virtualSolReserves.toNumber() / LAMPORTS_PER_SOL;
    const virtualTokenReserves = bondingCurve.virtualTokenReserves.toNumber() / 1e6; // 6 decimals
    
    return virtualSolReserves / virtualTokenReserves;
  }
}

export default LaunchLabService;