require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract, parseEther } = require("ethers");
const fs = require("fs");
const path = require("path");

const baalAbi = require("./abis/Baal.json");

async function main() {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.WALLET_A_PRIVATE_KEY, provider);
  const walletB = new Wallet(process.env.WALLET_B_PRIVATE_KEY);

  const baalAddress = process.env.BAAL_ADDRESS;
  if (!baalAddress) {
    console.error("BAAL_ADDRESS not set. Run 1-summon-dao.js first.");
    process.exit(1);
  }

  const baal = new Contract(baalAddress, baalAbi, wallet);

  console.log("Submitting proposal from:", wallet.address);
  console.log("Baal DAO:", baalAddress);

  // Encode mintShares call for Wallet B
  const mintCall = baal.interface.encodeFunctionData("mintShares", [
    [walletB.address],
    [parseEther("1")]
  ]);

  // Use Baal's on-chain encodeMultisend to get correctly formatted proposalData
  const proposalData = await baal.encodeMultisend([mintCall], baalAddress);
  console.log("ProposalData (first 100):", proposalData.slice(0, 100));

  console.log("Proposal: Mint 1 share to Wallet B:", walletB.address);

  const tx = await baal.submitProposal(proposalData, 0, 0, "Mint shares to Wallet B");
  console.log("Tx sent:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  // Parse SubmitProposal event to get proposal ID
  const submitLog = receipt.logs.find((log) => {
    try {
      const parsed = baal.interface.parseLog(log);
      return parsed && parsed.name === "SubmitProposal";
    } catch {
      return false;
    }
  });

  if (!submitLog) {
    console.error("Could not find SubmitProposal event");
    process.exit(1);
  }

  const parsed = baal.interface.parseLog(submitLog);
  const proposalId = parsed.args.proposal.toString();

  // Save to .env
  const envPath = path.join(__dirname, ".env");
  let envContent = fs.readFileSync(envPath, "utf-8");
  envContent = envContent.replace(/PROPOSAL_ID=.*/, `PROPOSAL_ID=${proposalId}`);
  envContent = envContent.replace(/PROPOSAL_DATA=.*/, `PROPOSAL_DATA=${proposalData}`);
  fs.writeFileSync(envPath, envContent);

  console.log("\n--- Proposal Submitted ---");
  console.log("  Proposal ID:   ", proposalId);
  console.log("  Tx Hash:       ", tx.hash);
  console.log("  Explorer:       https://sepolia.etherscan.io/tx/" + tx.hash);
  console.log("\nNext: node 3-vote.js");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
