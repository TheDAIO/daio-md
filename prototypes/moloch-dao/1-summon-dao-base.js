require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract, AbiCoder, parseEther, ZeroAddress } = require("ethers");

// BaalAdvTokenSummoner proxy on Base
const SUMMONER = "0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11";
const BASE_RPC = "https://mainnet.base.org";
const summonerAbi = require("./abis/BaalAdvTokenSummoner.json");
const baalAbi = require("./abis/Baal.json");

async function main() {
  const provider = new JsonRpcProvider(BASE_RPC);
  const wallet = new Wallet(process.env.BASE_PRIVATE_KEY, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log("Summoner wallet:", wallet.address);
  console.log("Balance:", balance.toString(), "wei");

  if (balance === 0n) {
    console.error("Wallet has no ETH on Base. Fund it first.");
    process.exit(1);
  }

  const summoner = new Contract(SUMMONER, summonerAbi, wallet);
  const coder = AbiCoder.defaultAbiCoder();
  const baalIface = new Contract(ZeroAddress, baalAbi).interface;

  // initializationMintParams: (address[] members, uint256[] shareAmounts, uint256[] lootAmounts)
  const initializationMintParams = coder.encode(
    ["address[]", "uint256[]", "uint256[]"],
    [
      [wallet.address],          // patient zero
      [parseEther("100")],       // 100 shares
      [parseEther("0")]          // 0 loot
    ]
  );

  // initializationTokenParams: (string sharesName, string sharesSymbol, string lootName, string lootSymbol, bool transferableShares, bool transferableLoot)
  const initializationTokenParams = coder.encode(
    ["string", "string", "string", "string", "bool", "bool"],
    ["DAIO Shares", "vDAIO", "DAIO Loot", "nvDAIO", false, false]
  );

  // postInitializationActions: governance config
  // voting=43200s (12h), grace=21600s (6h), offering=0, quorum=0, sponsor=1, minRetention=0
  const govConfig = coder.encode(
    ["uint32", "uint32", "uint256", "uint256", "uint256", "uint256"],
    [43200, 21600, 0, 0, 1, 0]
  );
  const setGovAction = baalIface.encodeFunctionData("setGovernanceConfig", [govConfig]);

  const postInitializationActions = [setGovAction];
  const saltNonce = Date.now();

  console.log("\n--- Deploying DAIO on Base Mainnet ---");
  console.log("  Shares token:   DAIO Shares (vDAIO)");
  console.log("  Loot token:     DAIO Loot (nvDAIO)");
  console.log("  Voting period:  12 hours");
  console.log("  Grace period:   6 hours");
  console.log("  Sponsor thresh: 1 (auto-sponsor)");
  console.log("  Patient zero:  ", wallet.address, "(100 shares)");
  console.log("  Salt nonce:    ", saltNonce);
  console.log("\nSending summonBaalFromReferrer tx...");

  const tx = await summoner.summonBaalFromReferrer(
    ZeroAddress,                    // _safeAddr (0x0 = deploy new Safe)
    ZeroAddress,                    // _forwarderAddr
    saltNonce,
    initializationMintParams,
    initializationTokenParams,
    postInitializationActions
  );

  console.log("Tx sent:", tx.hash);
  console.log("Explorer: https://basescan.org/tx/" + tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  // Parse SummonBaal event from the underlying BaalSummoner
  // The event is emitted by the base summoner, not the adv token summoner
  const baalSummonerAbi = require("./abis/BaalSummoner.json");
  const baalSummonerIface = new Contract(ZeroAddress, baalSummonerAbi).interface;

  let baalAddress, safeAddress, sharesAddress, lootAddress;

  for (const log of receipt.logs) {
    try {
      const parsed = baalSummonerIface.parseLog(log);
      if (parsed && parsed.name === "SummonBaal") {
        baalAddress = parsed.args.baal;
        lootAddress = parsed.args.loot;
        sharesAddress = parsed.args.shares;
        safeAddress = parsed.args.safe;
        break;
      }
    } catch {}
  }

  if (!baalAddress) {
    console.error("Could not find SummonBaal event in receipt");
    console.log("All log topics:");
    receipt.logs.forEach((l, i) => console.log(`  [${i}]`, l.topics[0]));
    process.exit(1);
  }

  console.log("\n=== DAIO DAO Deployed on Base ===");
  console.log("  Baal (DAO):    ", baalAddress);
  console.log("  Safe (Treasury):", safeAddress);
  console.log("  Shares Token:  ", sharesAddress);
  console.log("  Loot Token:    ", lootAddress);
  console.log("  Tx Hash:       ", tx.hash);
  console.log("  Explorer:       https://basescan.org/tx/" + tx.hash);
  console.log("  DAOhaus Admin:  https://admin.daohaus.fun/#/molochv3/0x2105/" + baalAddress);
  console.log("\nSave these addresses! Add them to docs/skill.md.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
