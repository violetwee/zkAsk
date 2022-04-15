import { CONSTANTS } from './constants'

export default function getStatusName(statusId) {
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