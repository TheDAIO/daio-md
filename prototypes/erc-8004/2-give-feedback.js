require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract, ZeroHash } = require("ethers");

const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
const abi = require("./abis/ReputationRegistry.json");

async function main() {
  const { WALLET_B_PRIVATE_KEY, RPC_URL, AGENT_ID } = process.env;

  if (!AGENT_ID) {
    console.error("AGENT_ID not set. Run 1-register-agent.js first.");
    process.exit(1);
  }

  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(WALLET_B_PRIVATE_KEY, provider);

  console.log("Giving feedback from:", wallet.address);
  console.log("Agent ID:", AGENT_ID);
  console.log("Contract:", REPUTATION_REGISTRY);

  const registry = new Contract(REPUTATION_REGISTRY, abi, wallet);

  const tx = await registry.giveFeedback(
    AGENT_ID,   // agentId
    85,          // value (score out of 100)
    0,           // valueDecimals
    "quality",   // tag1
    "prototype", // tag2
    "",          // endpoint
    "",          // feedbackURI
    ZeroHash     // feedbackHash
  );

  console.log("Tx sent:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  console.log("\n--- Feedback Submitted ---");
  console.log("  Agent ID:  ", AGENT_ID);
  console.log("  Score:      85 / 100");
  console.log("  Tags:       quality, prototype");
  console.log("  Tx Hash:   ", tx.hash);
  console.log("  Explorer:   https://sepolia.basescan.org/tx/" + tx.hash);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
