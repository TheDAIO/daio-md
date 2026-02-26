require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract } = require("ethers");

const baalAbi = require("./abis/Baal.json");

const STATES = ["Unborn", "Submitted", "Voting", "Grace", "Expired", "Ready", "Processed", "Cancelled", "Defeated"];

async function main() {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.WALLET_A_PRIVATE_KEY, provider);

  const baalAddress = process.env.BAAL_ADDRESS;
  const proposalId = process.env.PROPOSAL_ID;
  if (!baalAddress || !proposalId) {
    console.error("BAAL_ADDRESS or PROPOSAL_ID not set. Run previous scripts first.");
    process.exit(1);
  }

  const baal = new Contract(baalAddress, baalAbi, wallet);

  console.log("Voting from:", wallet.address);
  console.log("Baal DAO:", baalAddress);
  console.log("Proposal ID:", proposalId);

  // getPriorVotes requires votingStarts < block.timestamp on-chain.
  // Wait until the latest block timestamp is past votingStarts.
  const proposal = await baal.proposals(proposalId);
  const votingStarts = Number(proposal.votingStarts);
  console.log("Voting starts timestamp:", votingStarts);
  while (true) {
    const block = await provider.getBlock("latest");
    if (block.timestamp > votingStarts) break;
    console.log(`Latest block timestamp ${block.timestamp} <= votingStarts ${votingStarts}, waiting 15s...`);
    await new Promise((r) => setTimeout(r, 15000));
  }

  const stateBefore = await baal.state(proposalId);
  console.log("State before vote:", STATES[Number(stateBefore)] || stateBefore.toString());

  console.log("Submitting YES vote...");
  const tx = await baal.submitVote(proposalId, true);
  console.log("Tx sent:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  const stateAfter = await baal.state(proposalId);
  console.log("State after vote:", STATES[Number(stateAfter)] || stateAfter.toString());

  const updatedProposal = await baal.proposals(proposalId);
  console.log("\n--- Vote Cast ---");
  console.log("  Yes votes:", updatedProposal.yesVotes.toString());
  console.log("  No votes: ", updatedProposal.noVotes.toString());
  console.log("  Tx Hash:  ", tx.hash);
  console.log("  Explorer:  https://sepolia.etherscan.io/tx/" + tx.hash);
  console.log("\nNext: Wait for voting+grace period (~3 min), then: node 4-process-proposal.js");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
