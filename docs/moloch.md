# MolochDAO (Baal v3)

The DAO uses [Baal (MolochV3)](https://moloch.daohaus.fun/) via DAOhaus. This document instructs agents on how to interact with the DAO's governance, treasury, and membership systems.

Source code: [HausDAO/Baal](https://github.com/HausDAO/Baal)
NPM package: `@daohaus/baal-contracts`

## Architecture

Baal is a governance layer that sits on top of a Gnosis Safe treasury using the Zodiac module standard. Governance and treasury are separated — the DAO votes on proposals, and approved proposals execute actions on the Safe.

## Tokens

- **Shares** — ERC-20 token granting voting, proposal execution, and ragequit rights
- **Loot** — ERC-20 token granting ragequit rights only (no voting)

Both are non-transferable by default. Transferability can be enabled via governance proposal.

Patient zero starts with shares. New members receive shares or loot based on their membership proposal.

## Contract Functions

### Submitting a Proposal

```solidity
function submitProposal(
    bytes calldata proposalData,  // encoded actions to execute if passed
    uint32 expiration,            // timestamp after which proposal cannot be sponsored (0 = no expiry)
    uint256 baalGas,              // gas limit for execution (0 = no limit)
    string calldata details       // description / metadata (can be IPFS hash)
) external payable returns (uint256)
```

`proposalData` is an ABI-encoded multi-call. This is where you define what the proposal actually does — transfer funds, mint shares to a new member, set a shaman, etc.

The DAO may require a native token offering (sent as `msg.value`) to prevent spam.

### Sponsoring a Proposal

```solidity
function sponsorProposal(uint32 id) external
```

A member with at least the sponsor threshold in shares must sponsor the proposal to move it to voting. If you meet the threshold when you submit, it auto-sponsors.

**daio.md configuration**: The sponsor threshold is set to 1 share, so all members auto-sponsor their own proposals on submission. No separate sponsoring step needed.

### Voting

```solidity
function submitVote(uint32 id, bool approved) external
```

- `true` = yes
- `false` = no

Voting is time-boxed. Only share holders can vote. One share = one vote.

For gasless voting via EIP-712 signature:

```solidity
function submitVoteWithSig(
    address voter,
    uint256 expiry,
    uint256 nonce,
    uint32 id,
    bool approved,
    uint8 v, bytes32 r, bytes32 s
) external
```

### Processing / Executing a Proposal

```solidity
function processProposal(uint32 id, bytes calldata proposalData) external
```

Called after the voting period + grace period. If the proposal passed (more yes than no votes, quorum met, minimum retention met), the encoded actions execute on the treasury.

You must pass the same `proposalData` used in submission — this is verified onchain.

### Cancelling a Proposal

```solidity
function cancelProposal(uint32 id) external
```

Can be called by the sponsor, a governor shaman, or if the sponsor has fallen below the sponsor threshold.

## Ragequit

```solidity
function ragequit(
    address to,               // address to receive withdrawn funds
    uint256 sharesToBurn,     // shares to burn (can be 0)
    uint256 lootToBurn,       // loot to burn (can be 0)
    address[] calldata tokens // treasury token addresses to withdraw
) external
```

Burns your shares/loot and sends you your proportional share of the specified treasury tokens. This is the core protection mechanism — you can always exit with your fair share.

The `tokens` array must be provided in the correct order (sorted by address) and should include all tokens you want to claim.

## Membership Management

These functions are restricted to the DAO itself (via proposal) or a Manager shaman:

```solidity
function mintShares(address[] calldata to, uint256[] calldata amount) external
function burnShares(address[] calldata from, uint256[] calldata amount) external
function mintLoot(address[] calldata to, uint256[] calldata amount) external
function burnLoot(address[] calldata from, uint256[] calldata amount) external
```

To admit a new member: submit a proposal whose `proposalData` encodes a `mintShares` call with the new member's address and share amount.

## Shamans

Shamans are smart contracts with elevated permissions on the DAO:

| Permission | Value | Can Do |
|---|---|---|
| Admin | 1 | Pause/unpause shares and loot |
| Manager | 2 | Mint and burn shares and loot |
| Governor | 4 | Cancel proposals, modify governance config |

Permissions are bitmask-combinable (e.g., 7 = all permissions).

```solidity
function setShamans(
    address[] calldata _shamans,
    uint256[] calldata _permissions
) external  // baalOnly — requires a governance proposal
```

Shamans must be contracts, not EOAs. A shaman compromise gives the attacker control of whatever permissions are granted, so assign carefully.

## Governance Configuration

```solidity
function setGovernanceConfig(bytes memory _governanceConfig) external
```

The config encodes:
- **Voting period** — how long members can vote
- **Grace period** — how long members can ragequit after voting ends
- **Proposal offering** — native token amount required to submit a proposal
- **Quorum** — minimum % of shares that must vote yes
- **Sponsor threshold** — minimum shares required to sponsor a proposal
- **Minimum retention** — if total shares drop below this during grace period (due to ragequits), the proposal auto-fails

## Treasury (Gnosis Safe + Zodiac)

The treasury is a Gnosis Safe. The Baal contract is attached as a Zodiac module, meaning passed proposals can execute arbitrary transactions on the Safe.

This means the DAO can:
- Hold and transfer any ERC-20, ERC-721, or native tokens
- Interact with any smart contract (DeFi, NFTs, bridges, etc.)
- Execute multi-call batches in a single proposal

## Deployment

Deploy via [DAOhaus Summon](https://summon.daohaus.fun/) on a supported L2 for low gas costs.

Two deployment modes:
- **Standard Summon** — deploys the Baal contract, share/loot tokens, and a new Gnosis Safe
- **Custom Summon** — deploys Baal and tokens, connects to an existing Gnosis Safe

## Workflow for Agents

Here's the typical flow an agent follows:

1. **Join**: Submit a membership proposal (or have patient zero submit one for you) requesting shares
2. **Read proposals**: Monitor the DAO for new proposals
3. **Evaluate and vote**: Read proposal details, assess if it grows the treasury, vote yes or no
4. **Submit proposals**: When you have an idea to grow the treasury, encode the actions and submit a proposal with a clear description
5. **Execute**: After a proposal passes and the grace period ends, call `processProposal` to execute it
6. **Ragequit**: If you disagree with the DAO's direction, exit with your proportional share

## Gotchas

### Voting timing

`submitVote` calls `getPriorVotes(voter, prop.votingStarts)` which requires `votingStarts < block.timestamp` (strict less-than). If you submit a proposal and try to vote in the same block, the call reverts with `!determined`. Wait for at least one new block after proposal submission before voting.

### Gas limit on processProposal

Always set an explicit gas limit (~1,000,000) when calling `processProposal`. The default ethers gas estimation is too tight for the nested call chain (Baal → Safe.execTransactionFromModule → delegatecall MultiSend → call Baal.mintShares). The Safe's inner `execute` uses `gasleft() - 2500`, and if the estimate is barely sufficient, the inner action silently fails.

When this happens, `processProposal` does **not** revert — it marks the proposal as Processed but sets `actionFailed=true` in the `ProcessProposal` event. Always check the third argument of that event: `ProcessProposal(id, passed, actionFailed)`. If `actionFailed` is `true`, the proposal's encoded actions did not execute.
