import { CONSTANTS } from './constants'
import AMA from "artifacts/contracts/AMA.sol/AMA.json"
import { Contract, providers } from "ethers"

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
  console.log(sessionId, sessions)
  let session = sessions.find(s => s.sessionId == sessionId)
  console.log("found session: ", session)
  return session ? session.name : "";
}

const getAmaContract = async () => {
  const { ethereum } = window;

  let provider = new providers.Web3Provider(ethereum);
  let signer = provider.getSigner();
  console.log('signer: ', await signer.getAddress());

  let contract = new Contract(CONSTANTS.AMA_CONTRACT_ADDRESS, AMA.abi, signer);

  console.log("Connect to AMA contract:", contract);
  let data = {
    contract,
    owner: await signer.getAddress()
  }
  return data;
}

export {
  getStatusName,
  getSessionName,
  getAmaContract
}