import { CONSTANTS } from './constants'

function getStatusName(statusId) {
  switch (statusId) {
    case CONSTANTS.NOT_STARTED:
      return "Not Started"
    case CONSTANTS.PAUSED:
      return "Paused"
    case CONSTANTS.ACTIVE:
      return "Active"
    case CONSTANTS.ENDED:
      return "Ended"
    default: return "-"
  }
}

function getSessionName(sessionId, sessions) {
  let session = sessions.find(s => s.session_id == sessionId)
  return session ? session.name : "";
}

export {
  getStatusName,
  getSessionName
}