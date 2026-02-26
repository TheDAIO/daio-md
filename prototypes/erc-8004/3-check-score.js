require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract } = require("ethers");

const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
const abi = require("./abis/ReputationRegistry.json");

async function main() {
  const { WALLET_B_PRIVATE_KEY, RPC_URL, AGENT_ID } = process.env;

  if (!AGENT_ID) {
    console.error("AGENT_ID not set. Run 1-register-agent.js first.");
    process.exit(1);
  }

  const provider = new JsonRpcProvider(RPC_URL);
  const walletB = new Wallet(WALLET_B_PRIVATE_KEY);

  console.log("Checking reputation for Agent ID:", AGENT_ID);
  console.log("Filtering by feedback from:", walletB.address);

  const registry = new Contract(REPUTATION_REGISTRY, abi, provider);

  const [count, value, decimals] = await registry.getSummary(
    AGENT_ID,
    [walletB.address], // clientAddresses filter
    "quality",          // tag1
    "prototype"         // tag2
  );

  console.log("\n--- Reputation Summary ---");
  console.log("  Agent ID:  ", AGENT_ID);
  console.log("  Count:     ", count.toString());
  console.log("  Value:     ", value.toString());
  console.log("  Decimals:  ", decimals.toString());

  if (count > 0n) {
    const score = Number(value) / 10 ** Number(decimals);
    console.log("  Score:     ", score, "/ 100");
  } else {
    console.log("  No feedback found for these filters.");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
