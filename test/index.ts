import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, genExternalNullifier, Semaphore, StrBigInt } from "@zk-kit/protocols"
import { expect } from "chai"
import { Contract, Signer, utils } from "ethers"
import { ethers, run } from "hardhat"

describe("AMA", function () {
    let contract: Contract

    const DEPTH = 20;
    const ZERO_VALUE = BigInt(0);
    const WASM_FILEPATH = "./public/semaphore.wasm"
    const FINAL_ZKEY_FILEPATH = "./public/semaphore_final.zkey"
    const IDENTITY_MESSAGE = "Sign this message to create your identity!";

    // declare test session ids and question ids
    const sessionIds = [BigInt(1), BigInt(2)];
    const questionIds = [BigInt(1), BigInt(2)];

    // declare some test accounts
    let signers: Signer[];
    let audience0: Signer;
    let audience1: Signer;
    let audience2: Signer;

    let accessCode = "123456";
    let accessCodeHash: string;

    before(async () => {
        contract = await run("deploy", { logs: false })
        signers = await ethers.getSigners()
        audience0 = signers[0];
        audience1 = signers[1];
        audience2 = signers[2];

        accessCodeHash = utils.keccak256(utils.toUtf8Bytes(accessCode));
    })

    describe("# AMA sessions (a.k.a Semaphore Groups)", () => {
        it("Should create an AMA session", async () => {
            const transaction = contract.createAmaSession(sessionIds[0], accessCodeHash);
            await expect(transaction).to.emit(contract, "AmaSessionCreated").withArgs(sessionIds[0])
        })

        it("Should not create a duplicated AMA session", async () => {
            const transaction = contract.createAmaSession(sessionIds[0], accessCodeHash);
            await expect(transaction).to.be.revertedWith("SemaphoreGroups: group already exists");
        })

        it("Should be able to create another AMA session", async () => {
            const transaction = contract.createAmaSession(sessionIds[1], accessCodeHash);
            await expect(transaction).to.emit(contract, "AmaSessionCreated").withArgs(sessionIds[1]);
        })

        it("Should start the AMA session", async () => {
            const transaction = contract.startAmaSession(sessionIds[0]);
            await expect(transaction).to.emit(contract, "AmaSessionActive").withArgs(sessionIds[0])
        })

        it("Should join an AMA session (audience0)", async () => {
            // create an identity commitment for the user
            const message = await audience0.signMessage(IDENTITY_MESSAGE)

            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()

            // join session: joinAmaSession(uint256 sessionId, uint256 identityCommitment)
            const transaction = contract.joinAmaSession(sessionIds[0], identityCommitment, accessCodeHash);
            await expect(transaction).to.emit(contract, "UserJoinedAmaSession").withArgs(sessionIds[0], identityCommitment)
        })

        it("Should join an AMA session (audience1)", async () => {
            // create an identity commitment for the user
            const message = await audience1.signMessage(IDENTITY_MESSAGE)

            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()

            // join session: joinAmaSession(uint256 sessionId, uint256 identityCommitment)
            const transaction = contract.joinAmaSession(sessionIds[0], identityCommitment, accessCodeHash);
            await expect(transaction).to.emit(contract, "UserJoinedAmaSession").withArgs(sessionIds[0], identityCommitment)
        })

        it("Should join an AMA session (audience2)", async () => {
            // create an identity commitment for the user
            const message = await audience2.signMessage(IDENTITY_MESSAGE)

            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()

            // join session: joinAmaSession(uint256 sessionId, uint256 identityCommitment)
            const transaction = contract.joinAmaSession(sessionIds[0], identityCommitment, accessCodeHash);
            await expect(transaction).to.emit(contract, "UserJoinedAmaSession").withArgs(sessionIds[0], identityCommitment)
        })
    })

    describe("# AMA questions (a.k.a Signals)", () => {
        let identity: ZkIdentity;
        let identityCommitment: bigint;
        let identityCommitments: StrBigInt[] = [];
        let signals = ["post", "vote"]; // user may only "post" a question or "vote" on a question, but not both
        let bytes32Signal0: string;

        before(async () => {
            // create an identity commitment for the user
            const message = await audience0.signMessage(IDENTITY_MESSAGE)
            identity = new ZkIdentity(Strategy.MESSAGE, message)
            identityCommitment = identity.genIdentityCommitment()

            bytes32Signal0 = ethers.utils.formatBytes32String(signals[0])

            // fetch identity commitments for sessionIds[0]
            const identityCommitmentsBN = await contract.getIdentityCommitments(sessionIds[0]);
            for (var i = 0; i < identityCommitmentsBN.length; i++) {
                identityCommitments.push(identityCommitmentsBN[i].toString());
            }
        });

        it("Should post a question to AMA session 1", async () => {
            const merkleProof = generateMerkleProof(DEPTH, ZERO_VALUE, identityCommitments, identityCommitment);
            const nullifier = `${sessionIds[0]}_${questionIds[0]}`;
            const externalNullifier = genExternalNullifier(nullifier);
            const questionNullifier = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier())

            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                questionNullifier,
                signals[0]
            )

            const { proof, publicSignals } = await Semaphore.genProof(witness, WASM_FILEPATH, FINAL_ZKEY_FILEPATH);
            const solidityProof = Semaphore.packToSolidityProof(proof)

            const transaction = contract.postQuestion(sessionIds[0], questionIds[0], bytes32Signal0, merkleProof.root, publicSignals.nullifierHash, publicSignals.externalNullifier, solidityProof)
            await expect(transaction).to.emit(contract, "NewQuestion").withArgs(sessionIds[0], questionIds[0], bytes32Signal0)
        })

        it("Should post another question to AMA session 1", async () => {
            const merkleProof = generateMerkleProof(DEPTH, ZERO_VALUE, identityCommitments, identityCommitment);
            const nullifier = `${sessionIds[0]}_${questionIds[1]}`;
            const externalNullifier = genExternalNullifier(nullifier);
            const questionNullifier = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier())

            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                questionNullifier,
                signals[0]
            )

            const { proof, publicSignals } = await Semaphore.genProof(witness, WASM_FILEPATH, FINAL_ZKEY_FILEPATH);
            const solidityProof = Semaphore.packToSolidityProof(proof)

            const transaction = contract.postQuestion(sessionIds[0], questionIds[0], bytes32Signal0, merkleProof.root, publicSignals.nullifierHash, publicSignals.externalNullifier, solidityProof)
            await expect(transaction).to.emit(contract, "NewQuestion").withArgs(sessionIds[0], questionIds[0], bytes32Signal0)
        })

        it("Should not post same question to AMA session 1", async () => {
            const merkleProof = generateMerkleProof(DEPTH, ZERO_VALUE, identityCommitments, identityCommitment);
            const nullifier = `${sessionIds[0]}_${questionIds[1]}`;
            const externalNullifier = genExternalNullifier(nullifier);
            const questionNullifier = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier())

            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                questionNullifier,
                signals[0] // post
            )

            const { proof, publicSignals } = await Semaphore.genProof(witness, WASM_FILEPATH, FINAL_ZKEY_FILEPATH);
            const solidityProof = Semaphore.packToSolidityProof(proof)

            const transaction = contract.postQuestion(sessionIds[0], questionIds[0], bytes32Signal0, merkleProof.root, publicSignals.nullifierHash, publicSignals.externalNullifier, solidityProof)
            await expect(transaction).to.be.revertedWith("SemaphoreCore: you cannot use the same nullifier twice");
        })

        it("Should not post and vote the same question in an AMA session", async () => {
            // user who posts the question cannot upvote his/her own question
            const merkleProof = generateMerkleProof(DEPTH, ZERO_VALUE, identityCommitments, identityCommitment);
            const nullifier = `${sessionIds[0]}_${questionIds[1]}`;
            const externalNullifier = genExternalNullifier(nullifier);
            const questionNullifier = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier())

            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                questionNullifier,
                signals[1] // vote
            )

            const { proof, publicSignals } = await Semaphore.genProof(witness, WASM_FILEPATH, FINAL_ZKEY_FILEPATH);
            const solidityProof = Semaphore.packToSolidityProof(proof)

            const transaction = contract.postQuestion(sessionIds[0], questionIds[0], bytes32Signal0, merkleProof.root, publicSignals.nullifierHash, publicSignals.externalNullifier, solidityProof)
            await expect(transaction).to.be.revertedWith("SemaphoreCore: you cannot use the same nullifier twice");
        })

        it("Should upvote a question in an AMA session", async () => {
            // create an identity commitment for the user
            const message = await audience1.signMessage(IDENTITY_MESSAGE)
            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()

            const merkleProof = generateMerkleProof(DEPTH, ZERO_VALUE, identityCommitments, identityCommitment);
            const nullifier = `${sessionIds[0]}_${questionIds[1]}`;
            const externalNullifier = genExternalNullifier(nullifier);
            const questionNullifier = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier())

            let bytes32Signal1 = ethers.utils.formatBytes32String(signals[1])

            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                questionNullifier,
                signals[1]
            )

            const { proof, publicSignals } = await Semaphore.genProof(witness, WASM_FILEPATH, FINAL_ZKEY_FILEPATH);
            const solidityProof = Semaphore.packToSolidityProof(proof)

            const transaction = contract.voteQuestion(sessionIds[0], questionIds[0], bytes32Signal1, merkleProof.root, publicSignals.nullifierHash, publicSignals.externalNullifier, solidityProof)
            await expect(transaction).to.emit(contract, "QuestionVoted").withArgs(sessionIds[0], questionIds[0], 1) // 1 vote
        })

        it("Should not upvote the same question in an AMA session", async () => {
            // create an identity commitment for the user
            const message = await audience1.signMessage(IDENTITY_MESSAGE)
            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()

            const merkleProof = generateMerkleProof(DEPTH, ZERO_VALUE, identityCommitments, identityCommitment);
            const nullifier = `${sessionIds[0]}_${questionIds[1]}`;
            const externalNullifier = genExternalNullifier(nullifier);
            const questionNullifier = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier())

            let bytes32Signal1 = ethers.utils.formatBytes32String(signals[1])

            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                questionNullifier,
                signals[1]
            )

            const { proof, publicSignals } = await Semaphore.genProof(witness, WASM_FILEPATH, FINAL_ZKEY_FILEPATH);
            const solidityProof = Semaphore.packToSolidityProof(proof)

            const transaction = contract.voteQuestion(sessionIds[0], questionIds[0], bytes32Signal1, merkleProof.root, publicSignals.nullifierHash, publicSignals.externalNullifier, solidityProof)
            await expect(transaction).to.be.revertedWith("SemaphoreCore: you cannot use the same nullifier twice");
        })
    })

    describe("AMA session state checks", () => {
        it("Should pause the AMA session", async () => {
            const transaction = contract.pauseAmaSession(sessionIds[0]);
            await expect(transaction).to.emit(contract, "AmaSessionPaused").withArgs(sessionIds[0])
        })

        it("Should resume a paused AMA session", async () => {
            const transaction = contract.resumeAmaSession(sessionIds[0]);
            await expect(transaction).to.emit(contract, "AmaSessionActive").withArgs(sessionIds[0])
        })

        it("Should end the AMA session", async () => {
            const transaction = contract.endAmaSession(sessionIds[0]);
            await expect(transaction).to.emit(contract, "AmaSessionEnded").withArgs(sessionIds[0])
        })

        it("Should not start an AMA session that has ended", async () => {
            const transaction = contract.startAmaSession(sessionIds[0]);
            await expect(transaction).to.be.revertedWith("AMA session's state should be Not Started");
        })
    })
})
