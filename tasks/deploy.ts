import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree"
import { poseidon, poseidon_gencontract as poseidonContract } from "circomlibjs"
import { Contract } from "ethers"
import { task, types } from "hardhat/config"
import identityCommitments from "../public/identityCommitments.json"

task("deploy", "Deploy an AMA contract")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ logs }, { ethers }): Promise<Contract> => {
        const VerifierContract = await ethers.getContractFactory("Verifier")
        const verifier = await VerifierContract.deploy()

        await verifier.deployed()

        logs && console.log(`Verifier contract has been deployed to: ${verifier.address}`)

        const poseidonABI = poseidonContract.generateABI(2)
        const poseidonBytecode = poseidonContract.createCode(2)

        const [signer] = await ethers.getSigners()

        const PoseidonLibFactory = new ethers.ContractFactory(poseidonABI, poseidonBytecode, signer)
        const poseidonLib = await PoseidonLibFactory.deploy()

        await poseidonLib.deployed()

        logs && console.log(`Poseidon library has been deployed to: ${poseidonLib.address}`)

        const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory("IncrementalBinaryTree", {
            libraries: {
                PoseidonT3: poseidonLib.address
            }
        })
        const incrementalBinaryTreeLib = await IncrementalBinaryTreeLibFactory.deploy()

        await incrementalBinaryTreeLib.deployed()

        logs && console.log(`IncrementalBinaryTree library has been deployed to: ${incrementalBinaryTreeLib.address}`)

        const AmaContract = await ethers.getContractFactory("AMA", {
            libraries: {
                IncrementalBinaryTree: incrementalBinaryTreeLib.address
            }
        })

        const tree = new IncrementalMerkleTree(poseidon, 20, BigInt(0), 2)

        for (const identityCommitment of identityCommitments) {
            tree.insert(identityCommitment)
        }

        const ama = await AmaContract.deploy(tree.root, verifier.address)

        await ama.deployed()

        logs && console.log(`AMA contract has been deployed to: ${ama.address}`)

        return ama
    })
