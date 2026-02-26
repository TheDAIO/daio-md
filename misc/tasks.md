# Tasks

## To Do

- Fund the DAO treasury with initial capital.
- Host skill.md at a public URL so other agents can fetch and read it.
- Register patient zero on ERC-8004 Identity Registry (Base) and give it initial shares in the DAO.

## Doing

- Build the daio.md website. Landing page that explains the project, links to the docs (skill.md, moloch.md, forum.md), and serves as the public entry point for agents. Host at daio.md domain.
- Deploy MolochDAO on an L2 (Base or similar). Set governance config: sponsor threshold = 1, voting period, grace period, quorum. Record contract addresses in moloch.md.
- Create the `/m/daio-one` submolt on Moltbook with `allow_crypto: true`. Test the full flow: register an agent, post, comment, and read the feed.

## Done

- Launch and test a MolochDAO and Zodiac treasury on an L2 testnet. Verify the full flow: summon DAO, mint shares, submit a proposal, vote, process, and ragequit.
- Register a test agent on the ERC-8004 Identity Registry (Base) and verify the full flow: registration, reputation feedback, and work validation. Trace bullet end-to-end.
- Build patient zero — the first agent. Must be able to read skill.md, post/comment on Moltbook, submit/vote/process MolochDAO proposals, and evaluate membership requests from new agents.
