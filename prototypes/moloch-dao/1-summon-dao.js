require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract, AbiCoder, parseEther, ZeroAddress } = require("ethers");
const fs = require("fs");
const path = require("path");

const BAAL_SUMMONER = "0xB2B3909661552942AE1115E9Fc99dF0BC93d71d0";
const summonerAbi = require("./abis/BaalSummoner.json");
const baalAbi = require("./abis/Baal.json");

async function main() {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.WALLET_A_PRIVATE_KEY, provider);
  const walletB = new Wallet(process.env.WALLET_B_PRIVATE_KEY);

  console.log("Summoning DAO from:", wallet.address);
  console.log("Summoner contract:", BAAL_SUMMONER);

  const summoner = new Contract(BAAL_SUMMONER, summonerAbi, wallet);
  const coder = AbiCoder.defaultAbiCoder();

  // initializationParams: name, symbol, safeAddr, forwarder, lootToken, sharesToken
  const initializationParams = coder.encode(
    ["string", "string", "address", "address", "address", "address"],
    ["DAIO", "DAIO", ZeroAddress, ZeroAddress, ZeroAddress, ZeroAddress]
  );

  // Build initialization actions (calls to the Baal proxy)
  const baalIface = new Contract(ZeroAddress, baalAbi).interface;

  // 1. setGovernanceConfig: voting=120s, grace=60s, offering=0, quorum=0, sponsor=1, minRetention=0
  const govConfig = coder.encode(
    ["uint32", "uint32", "uint256", "uint256", "uint256", "uint256"],
    [120, 60, 0, 0, 1, 0]
  );
  const setGovAction = baalIface.encodeFunctionData("setGovernanceConfig", [govConfig]);

  // 2. mintShares to Wallet A (1 share = 1e18)
  const mintAction = baalIface.encodeFunctionData("mintShares", [
    [wallet.address],
    [parseEther("1")]
  ]);

  const initializationActions = [setGovAction, mintAction];
  const saltNonce = Date.now();

  console.log("Salt nonce:", saltNonce);
  console.log("Sending summonBaal tx...");

  const tx = await summoner.summonBaal(initializationParams, initializationActions, saltNonce);
  console.log("Tx sent:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  // Parse SummonBaal event
  const summonLog = receipt.logs.find((log) => {
    try {
      const parsed = summoner.interface.parseLog(log);
      return parsed && parsed.name === "SummonBaal";
    } catch {
      return false;
    }
  });

  if (!summonLog) {
    console.error("Could not find SummonBaal event in receipt");
    console.log("All logs:", receipt.logs.map((l) => l.topics[0]));
    process.exit(1);
  }

  const parsed = summoner.interface.parseLog(summonLog);
  const baalAddress = parsed.args.baal;
  const lootAddress = parsed.args.loot;
  const sharesAddress = parsed.args.shares;
  const safeAddress = parsed.args.safe;

  // Save to .env
  const envPath = path.join(__dirname, ".env");
  let envContent = fs.readFileSync(envPath, "utf-8");
  envContent = envContent.replace(/BAAL_ADDRESS=.*/, `BAAL_ADDRESS=${baalAddress}`);
  envContent = envContent.replace(/SAFE_ADDRESS=.*/, `SAFE_ADDRESS=${safeAddress}`);
  envContent = envContent.replace(/SHARES_TOKEN=.*/, `SHARES_TOKEN=${sharesAddress}`);
  envContent = envContent.replace(/LOOT_TOKEN=.*/, `LOOT_TOKEN=${lootAddress}`);
  fs.writeFileSync(envPath, envContent);

  console.log("\n--- DAO Summoned ---");
  console.log("  Baal (DAO):    ", baalAddress);
  console.log("  Safe (Treasury):", safeAddress);
  console.log("  Shares Token:  ", sharesAddress);
  console.log("  Loot Token:    ", lootAddress);
  console.log("  Tx Hash:       ", tx.hash);
  console.log("  Explorer:       https://sepolia.etherscan.io/tx/" + tx.hash);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
