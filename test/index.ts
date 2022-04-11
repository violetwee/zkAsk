import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { expect } from "chai"
import { Contract, Signer, utils } from "ethers"
import { ethers, run } from "hardhat"
// import identityCommitments from "../public/identityCommitments.json"

describe("AMA", function () {
    let contract: Contract
    // let contractOwner: Signer

    const DEPTH = 20;
    const ZERO_VALUE = BigInt(0);
    const WASM_FILEPATH = "./public/semaphore.wasm"
    const FINAL_ZKEY_FILEPATH = "./public/semaphore_final.zkey"

    let signers: Signer[];
    let sessionId = 1;

    before(async () => {
        contract = await run("deploy", { logs: false })

        signers = await ethers.getSigners()
        // contractOwner = signers[0]
    })

    describe("# AMA sessions (a.k.a Semaphore Groups)", () => {
        it("Should create an AMA session", async () => {
            let title = "Staff Concerns";
            let pinHash = utils.keccak256(utils.toUtf8Bytes("123456"));
            console.log("pin hash = ", pinHash)

            const transaction = contract.createAmaSession(sessionId, DEPTH, title, pinHash);
            await expect(transaction).to.emit(contract, "AmaSessionCreated").withArgs(sessionId)
        })

        it("Should join an AMA session", async () => {
            // create an identity commitment for the user
            let audience1 = signers[0]
            const message = await audience1.signMessage("Sign this message to create your identity!")

            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()
            console.log("Should join an AMA session", identityCommitment)

            // join session: joinAmaSession(uint256 sessionId, uint256 identityCommitment)
            const transaction = contract.joinAmaSession(sessionId, identityCommitment);
            await expect(transaction).to.emit(contract, "UserJoinedAmaSession").withArgs(sessionId, identityCommitment)
        })
        //TESTING
        it("Should join an AMA session 1", async () => {
            // create an identity commitment for the user
            let audience1 = signers[1]
            const message = await audience1.signMessage("Sign this message to create your identity!")

            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()
            console.log("Should join an AMA session", identityCommitment)

            // join session: joinAmaSession(uint256 sessionId, uint256 identityCommitment)
            const transaction = contract.joinAmaSession(sessionId, identityCommitment);
            await expect(transaction).to.emit(contract, "UserJoinedAmaSession").withArgs(sessionId, identityCommitment)
        })

        it("Should join an AMA session 2", async () => {
            // create an identity commitment for the user
            let audience2 = signers[2]
            const message = await audience2.signMessage("Sign this message to create your identity!")

            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()
            console.log("Should join an AMA session", identityCommitment)

            // join session: joinAmaSession(uint256 sessionId, uint256 identityCommitment)
            const transaction = contract.joinAmaSession(sessionId, identityCommitment);
            await expect(transaction).to.emit(contract, "UserJoinedAmaSession").withArgs(sessionId, identityCommitment)
        })
        // END TESTING
    })

    describe("# AMA questions", () => {
        it("Should post a question to an AMA session", async () => {
            // create an identity commitment for the user
            let audience0 = signers[0]
            const message = await audience0.signMessage("Sign this message to create your identity!")
            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()
            console.log("identityCommitment", identityCommitment)

            // const question = "Why are existing staffs not considered for new roles?"
            const signal = "Hello world"
            const bytes32Signal = ethers.utils.formatBytes32String(signal)

            // fetch identity commitments for this session
            const identityCommitmentsBN = await contract.getIdentityCommitments(sessionId);
            var identityCommitments = [];
            for (var i = 0; i < identityCommitmentsBN.length; i++) {
                identityCommitments.push(identityCommitmentsBN[i].toString());
            }
            console.log(identityCommitments);


            const merkleProof = generateMerkleProof(DEPTH, ZERO_VALUE, identityCommitments, identityCommitment)
            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                merkleProof.root,
                signal
            )

            const fullProof = await Semaphore.genProof(witness, WASM_FILEPATH, FINAL_ZKEY_FILEPATH)
            const solidityProof = Semaphore.packToSolidityProof(fullProof.proof)
            const nullifierHash = Semaphore.genNullifierHash(merkleProof.root, identity.getNullifier())

            const transaction = contract.postQuestion(sessionId, bytes32Signal, nullifierHash, solidityProof)

            await expect(transaction).to.emit(contract, "NewQuestion").withArgs(sessionId, bytes32Signal)
        })

        it("Should not post the same question to an AMA session", async () => {
            // create an identity commitment for the user
            let audience0 = signers[0]
            const message = await audience0.signMessage("Sign this message to create your identity!")
            const identity = new ZkIdentity(Strategy.MESSAGE, message)
            const identityCommitment = identity.genIdentityCommitment()
            console.log("identityCommitment", identityCommitment)

            // const question = "Why are existing staffs not considered for new roles?"
            const signal = "Hello world"
            const bytes32Signal = ethers.utils.formatBytes32String(signal)

            // fetch identity commitments for this session
            const identityCommitmentsBN = await contract.getIdentityCommitments(sessionId);
            var identityCommitments = [];
            for (var i = 0; i < identityCommitmentsBN.length; i++) {
                identityCommitments.push(identityCommitmentsBN[i].toString());
            }

            const merkleProof = generateMerkleProof(DEPTH, ZERO_VALUE, identityCommitments, identityCommitment)
            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                merkleProof.root,
                signal
            )

            const fullProof = await Semaphore.genProof(witness, WASM_FILEPATH, FINAL_ZKEY_FILEPATH)
            const solidityProof = Semaphore.packToSolidityProof(fullProof.proof)
            const nullifierHash = Semaphore.genNullifierHash(merkleProof.root, identity.getNullifier())

            await expect(contract.postQuestion(sessionId, bytes32Signal, nullifierHash, solidityProof)).to.be.revertedWith("SemaphoreCore: you cannot use the same nullifier twice");
        })
    })
})
