//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@appliedzkp/semaphore-contracts/interfaces/IVerifier.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreCore.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreGroups.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title AMA contract.
contract AMA is SemaphoreCore, SemaphoreGroups, Ownable {
    // Events
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
    event AmaSessionStatusChanged(uint256 sessionId, uint256 statusId);

    // AMA session states
    // NotStarted: Allows host to pre-create AMA session but keep it as inactive state. Audience may join but cannot post questions yet
    // Active: Audience may post questions
    // Paused: Host may pause a session temporarily if the number of questions is overwhelming or if the host wants to answer the current set of questions first
    // Ended: AMA session has ended. This is the final state. No more questions.
    uint256 constant NOT_STARTED = 1;
    uint256 constant PAUSED = 2;
    uint256 constant ACTIVE = 3;
    uint256 constant ENDED = 4;
    uint256 constant MAX_QUESTIONS = 100;

    struct AmaSession {
        uint256 sessionId;
        address owner;
        uint256 state;
    }

    struct Question {
        uint256 questionId;
        uint256 votes; // total number of votes
    }

    mapping(uint256 => AmaSession) public amaSessions; // sessionId => AMA Session
    mapping(bytes32 => Question) public amaSessionQuestion; // hash(sessionId, questionId) => Question
    mapping(uint256 => uint256[]) public amaSessionIdentityCommitments; // sessionId => identityCommitment[]
    mapping(uint256 => uint256[]) public amaSessionQuestionList; // sessionId => questionId[]
    // The external verifier used to verify Semaphore proofs.
    IVerifier public verifier;

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    /** 
        MODIFIERS
    */
    modifier amaNotStarted(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == NOT_STARTED,
            "AMA session's state should be Not Started"
        );
        _;
    }
    modifier amaActive(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == ACTIVE,
            "AMA session's state is not Active"
        );
        _;
    }
    modifier amaPaused(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == PAUSED,
            "AMA session's state is not Paused"
        );
        _;
    }
    modifier amaEnded(uint256 sessionId) {
        require(amaSessions[sessionId].state == ENDED, "AMA session has Ended");
        _;
    }
    modifier canJoinAma(uint256 sessionId) {
        require(
            amaSessions[sessionId].state == PAUSED ||
                amaSessions[sessionId].state == ACTIVE,
            "AMA session's state is not Paused or Active"
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
    modifier notOverQuestionLimit(uint256 sessionId) {
        require(
            amaSessionQuestionList[sessionId].length < MAX_QUESTIONS,
            "Maximum number of questions posted."
        );
        _;
    }

    /** 
        FUNCTIONS
    */
    // Session state changes
    // @dev Start an AMA session. Sets session state to Active. Participants can only post questions when status is Active.
    // @param sessionId Unique session id
    function startAmaSession(uint256 sessionId)
        external
        amaExists(sessionId)
        onlyAmaSessionOwner(sessionId)
        amaNotStarted(sessionId)
    {
        amaSessions[sessionId].state = ACTIVE;
        emit AmaSessionStatusChanged(sessionId, ACTIVE);
    }

    // @dev Pause an AMA session. Sets session state to Paused. Participants cannot post questions when status is Paused.
    // @param sessionId Unique session id
    function pauseAmaSession(uint256 sessionId)
        external
        amaExists(sessionId)
        onlyAmaSessionOwner(sessionId)
        amaActive(sessionId)
    {
        amaSessions[sessionId].state = PAUSED;
        emit AmaSessionStatusChanged(sessionId, PAUSED);
    }

    // @dev Resume a paused AMA session. Sets session state to Active.
    // @param sessionId Unique session id
    function resumeAmaSession(uint256 sessionId)
        external
        amaExists(sessionId)
        onlyAmaSessionOwner(sessionId)
        amaPaused(sessionId)
    {
        amaSessions[sessionId].state = ACTIVE;
        emit AmaSessionStatusChanged(sessionId, ACTIVE);
    }

    // @dev End an AMA session. Sets session state to Ended.
    // @param sessionId Unique session id
    function endAmaSession(uint256 sessionId)
        external
        amaExists(sessionId)
        onlyAmaSessionOwner(sessionId)
    {
        amaSessions[sessionId].state = ENDED;
        emit AmaSessionStatusChanged(sessionId, ENDED);
    }

    // Session activities
    // @dev Create an AMA session. Creates a Semaphore Group.
    // @param sessionId Unique session id
    function createAmaSession(uint256 sessionId) external {
        _createGroup(sessionId, 20, 0);

        amaSessions[sessionId] = AmaSession({
            sessionId: sessionId,
            owner: msg.sender,
            state: NOT_STARTED
        });

        emit AmaSessionCreated(sessionId);
    }

    // @dev Participant joins an AMA session. Adds a member identity commitment to the Semaphore Group.
    // @param sessionId Unique session id
    // @param identityCommitment Participant's identity commitment
    function joinAmaSession(uint256 sessionId, uint256 identityCommitment)
        external
        amaExists(sessionId)
        canJoinAma(sessionId)
    {
        _addMember(sessionId, identityCommitment);
        amaSessionIdentityCommitments[sessionId].push(identityCommitment);

        emit UserJoinedAmaSession(sessionId, identityCommitment);
    }

    // @dev Returns all identity commitments for a session/Sempahore Group.
    // @param sessionId Unique session id
    // @return Array of identity commitments
    function getIdentityCommitments(uint256 sessionId)
        external
        view
        returns (uint256[] memory)
    {
        return amaSessionIdentityCommitments[sessionId];
    }

    // @dev Participant posts a question to an AMA session.
    // @param sessionId Unique session id
    // @param questionId Unique question id
    // @param signal Semaphore signal (either "post" or "vote")
    // @param root Merkle root used for verification
    // @param nullifierHash Nullifier hash used for verification
    // @param externalNullifier Session id and question id (ie. 1_1). Prevents double posting of same ids.
    // @param proof Proof data to determine that user is a member of the Semaphore Group
    function postQuestion(
        uint256 sessionId,
        uint256 questionId,
        bytes32 signal,
        uint256 root,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    )
        external
        amaExists(sessionId)
        amaActive(sessionId)
        notOverQuestionLimit(sessionId)
    {
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

        // questionId is unique across all sessions
        bytes32 id = keccak256(abi.encodePacked(questionId));
        Question memory q = Question({questionId: questionId, votes: 0});
        amaSessionQuestion[id] = q;

        _saveNullifierHash(nullifierHash);
        emit NewQuestion(sessionId, questionId, signal);
    }

    // @dev Participant votes on a question in an AMA session.
    // @param sessionId Unique session id
    // @param questionId Unique question id
    // @param signal Semaphore signal (either "post" or "vote")
    // @param root Merkle root used for verification
    // @param nullifierHash Nullifier hash used for verification
    // @param externalNullifier Session id and question id (ie. 1_1). Prevents double voting.
    // @param proof Proof data to determine that user is a member of the Semaphore Group
    function voteQuestion(
        uint256 sessionId,
        uint256 questionId,
        bytes32 signal,
        uint256 root,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    )
        external
        amaExists(sessionId)
        amaActive(sessionId)
        returns (uint256, uint256)
    {
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

        // add votes to question. questionId is unique across all sessions
        bytes32 id = keccak256(abi.encodePacked(questionId));
        amaSessionQuestion[id].votes += 1;

        // Prevent double-voting of the same question
        _saveNullifierHash(nullifierHash);

        emit QuestionVoted(sessionId, questionId, amaSessionQuestion[id].votes);
        return (questionId, amaSessionQuestion[id].votes);
    }
}
