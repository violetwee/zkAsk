//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@appliedzkp/semaphore-contracts/interfaces/IVerifier.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreCore.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreGroups.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Greeters contract.
/// @dev The following code is just a example to show how Semaphore con be used.
contract AMA is SemaphoreCore, SemaphoreGroups, Ownable {
    // A new greeting is published every time a user's proof is validated.
    event NewQuestion(uint256 sessionId, bytes32 signal);
    event AmaSessionCreated(uint256 indexed groupId);
    event UserJoinedAmaSession(
        uint256 indexed groupId,
        uint256 identityCommitment
    );
    event UserLeftAmaSession(
        uint256 indexed groupId,
        uint256 identityCommitment
    );

    // NotStarted: Allows host to pre-create AMA session but keep it as inactive state. Audience may join but cannot post questions yet
    // Active: Audience may post questions
    // Paused: Host may pause a session temporarily if the number of questions is overwhelming or if the host wants to answer the current set of questions first
    // Ended: AMA session has ended. This is the final state. No more questions.
    enum SessionState {
        NotStarted,
        Active,
        Paused,
        Ended
    }

    struct AmaSession {
        string title;
        string pinHash;
        address owner;
        SessionState state;
    }
    struct Question {
        uint256 questionId;
        string text;
    }

    mapping(uint256 => AmaSession) public amaSessions; // sessionId => AMA Session
    mapping(uint256 => Question[]) public amaSessionQuestions; // sessionId => Question[]
    mapping(uint256 => uint256[]) public amaSessionIdentityCommitments; // sessionId => identityCommitment[]

    // Greeters are identified by a Merkle root.
    // The offchain Merkle tree contains the greeters' identity commitments.
    uint256 public greeters;

    // The external verifier used to verify Semaphore proofs.
    IVerifier public verifier;

    constructor(uint256 _greeters, address _verifier) {
        greeters = _greeters;
        verifier = IVerifier(_verifier);
    }

    function createAmaSession(
        uint256 sessionId,
        uint8 depth,
        string calldata title,
        string calldata pinHash
    ) external {
        _createGroup(sessionId, depth, 0);

        amaSessions[sessionId] = AmaSession({
            title: title,
            pinHash: pinHash,
            owner: msg.sender,
            state: SessionState.NotStarted
        });

        emit AmaSessionCreated(sessionId);
    }

    function joinAmaSession(uint256 sessionId, uint256 identityCommitment)
        external
    {
        _addMember(sessionId, identityCommitment);

        amaSessionIdentityCommitments[sessionId].push(identityCommitment);

        emit UserJoinedAmaSession(sessionId, identityCommitment);
    }

    function getIdentityCommitments(uint256 sessionId)
        external
        view
        returns (uint256[] memory)
    {
        return amaSessionIdentityCommitments[sessionId];
    }

    // function leaveAmaSession(
    //     uint256 sessionId,
    //     uint256 identityCommitment,
    //     uint256[] calldata proofSiblings,
    //     uint8[] calldata proofPathIndices
    // ) external {
    //     _removeMember(
    //         sessionId,
    //         identityCommitment,
    //         proofSiblings,
    //         proofPathIndices
    //     );
    //     emit UserLeftAmaSession(sessionId, identityCommitment);
    // }

    // Only users who create valid proofs can greet.
    // The contract owner must only send the transaction and they will not know anything
    // about the identity of the greeters.
    // The external nullifier is in this example the root of the Merkle tree.
    function postQuestion(
        uint256 sessionId,
        bytes32 signal,
        uint256 _nullifierHash,
        uint256[8] calldata _proof
    ) external {
        // TODO: check that sessionId exists
        // require(amaSessions[sessionId].id > 0, "AMA session does not exist");

        // bytes32 signal = keccak256(abi.encodePacked(sessionId, _question));

        require(
            _isValidProof(
                signal,
                greeters,
                _nullifierHash,
                greeters,
                _proof,
                verifier
            ),
            "AMA: the proof is not valid"
        );

        // Prevent double-greeting (nullifierHash = hash(root + identityNullifier)).
        // Every user can greet once.
        _saveNullifierHash(_nullifierHash);

        emit NewQuestion(sessionId, signal);
    }
}
