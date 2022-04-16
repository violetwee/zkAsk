//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@appliedzkp/semaphore-contracts/interfaces/IVerifier.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreCore.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreGroups.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Greeters contract.
/// @dev The following code is just a example to show how Semaphore con be used.
contract AMA is SemaphoreCore, SemaphoreGroups, Ownable {
    // A new greeting is published every time a user's proof is validated.
    event NewQuestion(uint256 sessionId, uint256 questionId, bytes32 signal);
    event QuestionVoted(uint256 sessionId, uint256 questionId, uint256 votes);
    event AmaSessionCreated(uint256 indexed sessionId);
    event UserJoinedAmaSession(
        uint256 indexed sessionId,
        uint256 identityCommitment
    );
    event UserLeftAmaSession(
        uint256 indexed sessionId,
        uint256 identityCommitment
    );

    event AmaSessionActive(uint256 sessionId);
    event AmaSessionPaused(uint256 sessionId);
    event AmaSessionEnded(uint256 sessionId);

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
        uint256 sessionId;
        address owner;
        bytes32 accessCodeHash; // only users with the access code can join the AMA session
        SessionState state;
    }

    struct Question {
        uint256 questionId;
        uint256 votes; // total number of votes
    }

    mapping(uint256 => AmaSession) public amaSessions; // sessionId => AMA Session
    mapping(bytes32 => Question) public amaSessionQuestion; // hash(sessionId, questionId) => Question
    mapping(uint256 => uint256[]) public amaSessionIdentityCommitments; // sessionId => identityCommitment[]

    // The external verifier used to verify Semaphore proofs.
    IVerifier public verifier;

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    /** 
        MODIFIERS
    */
    modifier hasAccess(uint256 sessionId, bytes32 accessCodeHash) {
        require(
            amaSessions[sessionId].accessCodeHash == accessCodeHash,
            "You do not have access to this AMA session"
        );
        _;
    }
    modifier amaNotStarted(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == SessionState.NotStarted,
            "AMA session's state should be Not Started"
        );
        _;
    }
    modifier amaActive(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == SessionState.Active,
            "AMA session's state should be Active"
        );
        _;
    }
    modifier amaPaused(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == SessionState.Paused,
            "AMA session's state should be Paused"
        );
        _;
    }
    modifier amaEnded(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == SessionState.Ended,
            "AMA session's state should be Ended"
        );
        _;
    }
    modifier canJoinAma(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == SessionState.Paused ||
                amaSessions[sessionId].state == SessionState.Active,
            "AMA session's state should be Paused or Active"
        );
        _;
    }
    modifier amaExists(uint256 sessionId) {
        require(
            amaSessions[sessionId].owner != address(0),
            "AMA session does not exist"
        );
        _;
    }
    modifier onlyAmaSessionOwner(uint256 sessionId) {
        require(
            amaSessions[sessionId].owner == msg.sender,
            "You are not the owner of this AMA session"
        );
        _;
    }

    /** 
        FUNCTIONS
    */
    // Session state changes
    function startAmaSession(uint256 sessionId)
        external
        onlyAmaSessionOwner(sessionId)
        amaNotStarted(sessionId)
    {
        amaSessions[sessionId].state = SessionState.Active;
        emit AmaSessionActive(sessionId);
    }

    function resumeAmaSession(uint256 sessionId)
        external
        onlyAmaSessionOwner(sessionId)
        amaPaused(sessionId)
    {
        amaSessions[sessionId].state = SessionState.Active;
        emit AmaSessionActive(sessionId);
    }

    function pauseAmaSession(uint256 sessionId)
        external
        onlyAmaSessionOwner(sessionId)
        amaActive(sessionId)
    {
        amaSessions[sessionId].state = SessionState.Paused;
        emit AmaSessionPaused(sessionId);
    }

    function endAmaSession(uint256 sessionId)
        external
        onlyAmaSessionOwner(sessionId)
    {
        amaSessions[sessionId].state = SessionState.Ended;
        emit AmaSessionEnded(sessionId);
    }

    // Session activities
    function createAmaSession(uint256 sessionId, bytes32 accessCodeHash)
        external
    {
        _createGroup(sessionId, 20, 0);

        amaSessions[sessionId] = AmaSession({
            sessionId: sessionId,
            accessCodeHash: accessCodeHash,
            owner: msg.sender,
            state: SessionState.NotStarted
        });

        emit AmaSessionCreated(sessionId);
    }

    function joinAmaSession(
        uint256 sessionId,
        uint256 identityCommitment,
        bytes32 accessCodeHash
    ) external hasAccess(sessionId, accessCodeHash) canJoinAma(sessionId) {
        _addMember(sessionId, identityCommitment);
        amaSessionIdentityCommitments[sessionId].push(identityCommitment);

        emit UserJoinedAmaSession(sessionId, identityCommitment);
    }

    function getAmaSession(uint256 sessionId)
        external
        view
        returns (AmaSession memory)
    {
        return amaSessions[sessionId];
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

    function postQuestion(
        uint256 sessionId,
        uint256 questionId,
        bytes32 signal,
        uint256 root,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) external amaExists(sessionId) amaActive(sessionId) {
        require(
            _isValidProof(
                signal,
                root,
                nullifierHash,
                externalNullifier,
                proof,
                verifier
            ),
            "AMA: the proof is not valid"
        );

        bytes32 id = keccak256(abi.encodePacked(sessionId, questionId));
        Question memory q = Question({questionId: questionId, votes: 0});
        amaSessionQuestion[id] = q;

        // Prevent double-posting of the same question in the same ama session
        _saveNullifierHash(nullifierHash);

        emit NewQuestion(sessionId, questionId, signal);
    }

    function voteQuestion(
        uint256 sessionId,
        uint256 questionId,
        bytes32 signal,
        uint256 root,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) external amaExists(sessionId) amaActive(sessionId) {
        require(
            _isValidProof(
                signal,
                root,
                nullifierHash,
                externalNullifier,
                proof,
                verifier
            ),
            "AMA: the proof is not valid"
        );

        // add votes to question
        bytes32 id = keccak256(abi.encodePacked(sessionId, signal));
        amaSessionQuestion[id].votes += 1;

        // Prevent double-voting of the same question in the same ama session
        _saveNullifierHash(nullifierHash);

        emit QuestionVoted(sessionId, questionId, amaSessionQuestion[id].votes);
    }
}
