# zku.one Final Project : zkAsk

zkAsk allows a host to create an AMA session where the audience can join and ask questions anonymously, creating an open and safe environment. Audiences can also vote anonymously for questions to be answered (community moderation via anonymous voting).

It leverages on Semaphore and zk-proofs to preserve the user’s identity.

- Demo video: https://www.youtube.com/watch?v=LbdWAydgKjQ
- Demo site: https://testnet.zkask.one

# Features

## Host

- create AMA sessions which may be public or secured with an access code (ie. audience would need an access code to join the AMA session - useful for study groups where only students can join, or corporate groups where only employees can join)
- update status of the AMA session
  - start: Audience may join and post questions
  - pause: Audience may join but cannot post questions
  - resume: Audience may post questions
  - end: Session has ended
- list created AMA sessions

## Audience/Participant

- list AMA sessions that are paused/active (ie. ready for audiences to join)
- join a public session or enter access code to join a private AMA session
- post a question to an AMA session
- vote on other audience's questions

# Contract Addresses (Harmony Testnet)

- Verifier contract: 0x8c1739023F7D01Db11b361CEa0569aCe379a321b
- AMA contract: 0x2e81a9D008400A4EF001Bb76AC636ddBB3eBcaf8

# Testing

`yarn test`

<img src="https://github.com/violetwee/zkAsk/blob/main/screenshots/tests.png" width="800px" height="auto"/>

# Setup database (mysql)

Create two tables: ama_sessions and ama_questions. Run the create scripts in /scripts folder.

Rename .env.example to .env and input the database connection properties.

# Test with Frontend UI

- `yarn install` to install all dependencies
- `yarn dev` to start a local node. Import a few of the test accounts into Metamask for testing purposes.
- `yarn deploy --network localhost` to deploy the smart contracts to the local node.

<img src="https://github.com/violetwee/zkAsk/blob/main/screenshots/frontend.png" width="800px" height="auto"/>

Copy the AMA contract address to lib/config.json

Then, browse to http://localhost:3000 to access the frontend UI.

# Deploy to Harmony Testnet

Run `yarn deploy --network testnet`

# Project Resources

- [Semaphore Boilerplate](https://github.com/cedoor/semaphore-boilerplate)
- [Semaphore](https://github.com/appliedzkp/semaphore)
- [Interep](https://github.com/interep-project)
- [Hardhat](https://hardhat.org/)
- [Solidity](https://docs.soliditylang.org/en/v0.8.13/)
