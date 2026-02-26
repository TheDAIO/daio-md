require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract } = require("ethers");

const baalAbi = require("./abis/Baal.json");

const STATES = ["Unborn", "Submitted", "Voting", "Grace", "Expired", "Ready", "Processed", "Cancelled", "Defeated"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.WALLET_A_PRIVATE_KEY, provider);

  const baalAddress = process.env.BAAL_ADDRESS;
  const proposalId = process.env.PROPOSAL_ID;
  const proposalData = process.env.PROPOSAL_DATA;
  if (!baalAddress || !proposalId || !proposalData) {
    console.error("BAAL_ADDRESS, PROPOSAL_ID, or PROPOSAL_DATA not set. Run previous scripts first.");
    process.exit(1);
  }

  const baal = new Contract(baalAddress, baalAbi, wallet);

  console.log("Processing proposal from:", wallet.address);
  console.log("Baal DAO:", baalAddress);
  console.log("Proposal ID:", proposalId);

  // Poll until proposal reaches Ready state (5)
  let currentState;
  while (true) {
    currentState = Number(await baal.state(proposalId));
    console.log("Current state:", STATES[currentState] || currentState);

    if (currentState === 5) break; // Ready
    if (currentState >= 6) {
      console.error("Proposal already processed or cancelled/defeated.");
      process.exit(1);
    }

    console.log("Waiting 30s for voting/grace period to elapse...");
    await sleep(30000);
  }

  console.log("Proposal is Ready. Processing...");
  // Explicit gas limit — auto-estimation underestimates because the inner
  // Safe delegate-call to multiSend needs extra headroom (gasleft()-2500).
  const tx = await baal.processProposal(proposalId, proposalData, { gasLimit: 1_000_000 });
  console.log("Tx sent:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  const stateAfter = Number(await baal.state(proposalId));
  console.log("State after processing:", STATES[stateAfter] || stateAfter);

  console.log("\n--- Proposal Processed ---");
  console.log("  Tx Hash:  ", tx.hash);
  console.log("  Explorer:  https://sepolia.etherscan.io/tx/" + tx.hash);
  console.log("\nNext: node 5-ragequit.js");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
