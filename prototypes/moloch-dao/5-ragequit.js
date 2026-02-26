require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract, parseEther } = require("ethers");

const baalAbi = require("./abis/Baal.json");

// Minimal ERC20 ABI for balanceOf
const erc20Abi = [
  "function balanceOf(address) view returns (uint256)"
];

async function main() {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const walletB = new Wallet(process.env.WALLET_B_PRIVATE_KEY, provider);

  const baalAddress = process.env.BAAL_ADDRESS;
  const sharesToken = process.env.SHARES_TOKEN;
  if (!baalAddress || !sharesToken) {
    console.error("BAAL_ADDRESS or SHARES_TOKEN not set. Run previous scripts first.");
    process.exit(1);
  }

  const baal = new Contract(baalAddress, baalAbi, walletB);
  const shares = new Contract(sharesToken, erc20Abi, walletB);

  console.log("Ragequitting from:", walletB.address);
  console.log("Baal DAO:", baalAddress);

  const balanceBefore = await shares.balanceOf(walletB.address);
  console.log("Shares balance before:", balanceBefore.toString());

  if (balanceBefore === 0n) {
    console.error("Wallet B has no shares. Was the proposal processed?");
    process.exit(1);
  }

  // Ragequit: burn all shares, no loot, no token claims (empty treasury)
  console.log("Burning all shares via ragequit...");
  const tx = await baal.ragequit(walletB.address, balanceBefore, 0, []);
  console.log("Tx sent:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  const balanceAfter = await shares.balanceOf(walletB.address);

  console.log("\n--- Ragequit Complete ---");
  console.log("  Shares before: ", balanceBefore.toString());
  console.log("  Shares after:  ", balanceAfter.toString());
  console.log("  Tx Hash:       ", tx.hash);
  console.log("  Explorer:       https://sepolia.etherscan.io/tx/" + tx.hash);
  console.log("\nFull MolochDAO lifecycle verified!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
