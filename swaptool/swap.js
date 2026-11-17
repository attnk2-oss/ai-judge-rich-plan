#!/usr/bin/env node
/**
 * Quote, sign and send a SOL -> USDC swap on Solana via Jupiter.
 *
 * Usage:
 *   node swap.js quote            show the quote only, sends nothing
 *   node swap.js send             execute the swap
 *
 * Env overrides: SOL_IN (default 0.02), SLIPPAGE_BPS (default 100 = 1%)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  Connection,
  Keypair,
  VersionedTransaction,
} = require('@solana/web3.js');

const RPC = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const KEYPAIR_PATH =
  process.env.KEYPAIR ||
  path.join(os.homedir(), '.makefun/wallets/token-radar.json');
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const LAMPORTS = 1e9;

const solIn = Number(process.env.SOL_IN || '0.02');
const slippageBps = Number(process.env.SLIPPAGE_BPS || '100');
const mode = process.argv[2] || 'quote';

function loadKeypair() {
  const raw = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'));
  const secret = Array.isArray(raw) ? raw.slice(0, 32) : Object.values(raw).slice(0, 32);
  return Keypair.fromSeed(Uint8Array.from(secret));
}

async function jup(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`jupiter ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function main() {
  const kp = loadKeypair();
  const conn = new Connection(RPC, 'confirmed');
  const balance = await conn.getBalance(kp.publicKey);
  console.log(`wallet      ${kp.publicKey.toBase58()}`);
  console.log(`SOL balance ${(balance / LAMPORTS).toFixed(9)} SOL`);
  console.log(`swapping    ${solIn} SOL  (slippage ${slippageBps / 100}%)`);
  console.log('');

  const amount = Math.floor(solIn * LAMPORTS);
  if (amount >= balance) {
    throw new Error(
      `amount ${amount} lamports >= balance ${balance}; leave room for fees`
    );
  }

  const qUrl =
    `https://lite-api.jup.ag/swap/v1/quote` +
    `?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}` +
    `&amount=${amount}&slippageBps=${slippageBps}&swapMode=ExactIn`;
  const quote = await jup(qUrl);

  const outUsdc = Number(quote.outAmount) / 1e6;
  const priceImpact = Number(quote.priceImpactPct) * 100;
  console.log('--- quote ---');
  console.log(`in         ${solIn} SOL`);
  console.log(`out        ${outUsdc.toFixed(6)} USDC`);
  console.log(`impact     ${priceImpact.toFixed(4)}%`);
  console.log(`route      ${(quote.routePlan || []).map((r) => r.swapInfo?.label).join(' -> ') || 'direct'}`);
  console.log('');

  if (mode !== 'send') {
    console.log('quote only. run with `send` to execute.');
    return;
  }

  const swapRes = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: kp.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });
  if (!swapRes.ok) {
    throw new Error(`swap build ${swapRes.status}: ${(await swapRes.text()).slice(0, 400)}`);
  }
  const { swapTransaction } = await swapRes.json();

  const tx = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, 'base64')
  );
  tx.sign([kp]);

  const sig = await conn.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  console.log(`sent       ${sig}`);
  console.log(`explorer   https://solscan.io/tx/${sig}`);

  const conf = await conn.confirmTransaction(sig, 'confirmed');
  if (conf.value.err) throw new Error(`tx failed: ${JSON.stringify(conf.value.err)}`);
  console.log('confirmed.');

  const after = await conn.getBalance(kp.publicKey);
  console.log(`SOL after  ${(after / LAMPORTS).toFixed(9)} SOL`);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
