require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract } = require("ethers");
const fs = require("fs");
const path = require("path");

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const abi = require("./abis/IdentityRegistry.json");

async function main() {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.WALLET_A_PRIVATE_KEY, provider);

  console.log("Registering agent from:", wallet.address);
  console.log("Contract:", IDENTITY_REGISTRY);

  const registry = new Contract(IDENTITY_REGISTRY, abi, wallet);

  const tx = await registry.register("https://example.com/agent.json");
  console.log("Tx sent:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  // Parse Transfer event to get the minted tokenId (agentId)
  const transferLog = receipt.logs.find((log) => {
    try {
      const parsed = registry.interface.parseLog(log);
      return parsed && parsed.name === "Transfer";
    } catch {
      return false;
    }
  });

  if (!transferLog) {
    console.error("Could not find Transfer event in receipt");
    process.exit(1);
  }

  const parsed = registry.interface.parseLog(transferLog);
  const agentId = parsed.args.tokenId.toString();

  // Save agentId to .env
  const envPath = path.join(__dirname, ".env");
  let envContent = fs.readFileSync(envPath, "utf-8");
  envContent = envContent.replace(/AGENT_ID=.*/, `AGENT_ID=${agentId}`);
  fs.writeFileSync(envPath, envContent);

  console.log("\n--- Agent Registered ---");
  console.log("  Agent ID: ", agentId);
  console.log("  Tx Hash:  ", tx.hash);
  console.log("  Explorer:  https://sepolia.basescan.org/tx/" + tx.hash);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
