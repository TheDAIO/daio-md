const { Wallet } = require("ethers");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

// Check if .env already exists with keys
if (fs.existsSync(envPath)) {
  const existing = fs.readFileSync(envPath, "utf-8");
  if (existing.includes("WALLET_A_PRIVATE_KEY=0x")) {
    console.log("Wallets already generated. Delete .env to regenerate.\n");
    const lines = existing.split("\n");
    for (const line of lines) {
      if (line.startsWith("WALLET_A_PRIVATE_KEY=") || line.startsWith("WALLET_B_PRIVATE_KEY=")) {
        const key = line.split("=")[1];
        if (key) {
          const wallet = new Wallet(key);
          console.log(`  ${line.split("=")[0]} → ${wallet.address}`);
        }
      }
    }
    console.log("\nFund both addresses with Base Sepolia ETH before running the scripts.");
    process.exit(0);
  }
}

// Generate two fresh wallets
const walletA = Wallet.createRandom();
const walletB = Wallet.createRandom();

const envContent = `# Base Sepolia RPC (public default, replace with your own for reliability)
RPC_URL=https://sepolia.base.org

# Wallet A — Agent Owner
WALLET_A_PRIVATE_KEY=${walletA.privateKey}

# Wallet B — Feedback Giver
WALLET_B_PRIVATE_KEY=${walletB.privateKey}

# Set by 1-register-agent.js after registration
AGENT_ID=
`;

fs.writeFileSync(envPath, envContent);

console.log("Wallets generated and saved to .env\n");
console.log("  Wallet A (Agent Owner):   ", walletA.address);
console.log("  Wallet B (Feedback Giver):", walletB.address);
console.log("\nNext steps:");
console.log("  1. Fund BOTH addresses with Base Sepolia ETH");
console.log("     Faucet: https://www.alchemy.com/faucets/base-sepolia");
console.log("  2. Run: node 1-register-agent.js");
