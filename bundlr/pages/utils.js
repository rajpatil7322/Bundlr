import { createClient } from 'urql'
import { challenge, getDefaultProfile } from "./queries";
import abi from './lenshub.json';
import { ethers } from 'ethers';


const APIURL = "https://api-mumbai.lens.dev/playground";

const proxy_contract_address = "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82"

export const urqlClient = createClient({
    url: APIURL,
})

export async function getChallenge(address) {
    const response = await urqlClient.query(challenge, { address }).toPromise();
    return response.data.challenge.text;
}


export async function getProfile(address) {
    const response = await urqlClient.query(getDefaultProfile, { address }).toPromise();
    return response;
}

export async function LensHub(profile_id, content) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const contract = new ethers.Contract(proxy_contract_address, abi, signer);
    const post_data = {
        profileId: profile_id,
        contentURI: content,
        collectModule: "0x0BE6bD7092ee83D44a6eC1D949626FeE48caB30c",
        collectModuleInitData: ethers.utils.defaultAbiCoder.encode(['bool'], ['true']).toString(),
        referenceModule: ethers.constants.AddressZero.toString(),
        referenceModuleInitData: "0x"
    }

    const tx = contract.post(post_data);
    return tx;
}