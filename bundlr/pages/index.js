import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import { use, useContext,useState } from 'react'
import { MainContext } from '@/context'
import BigNumber from 'bignumber.js'
import { ethers } from "ethers";
import { v4 as uuid } from 'uuid'
import { ContractType, LensGatedSDK, LensEnvironment, ScalarOperator } from '@lens-protocol/sdk-gated'
import { getProfile,LensHub } from './utils'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const[file,seFile]=useState();
  const[image,setimage]=useState();
  const[text,setText]=useState("");
  const[URI,setURI]=useState();
  const[amount,setAmount]=useState();
  const[address,setAddress]=useState();
  const[profileId,setprofileId]=useState();
  const[handle,setHandle]=useState();
  const[followNftAddress,setfollowNftAddress]=useState();
  const[size,setSize]=useState();


  const {initialize,fetchBalance,balance,bundlrInstance}=useContext(MainContext);
  const byteSize = str => new Blob([str]).size;
  
  async function intializeBundlr(){
    initialize()
  }

  const con="http://arweave.net/SgIeBa_lSMVD8NwM562bbgPXdSyyktlOhSUqqnC2oYg"
  function read(){
    fetch(con)
    .then(res => res.json())
    .then(json => {
        // Convert JSON to string
        console.log(json);
        return json;


     
        // const blob = new Blob([data], { type: 'application/json' });
        // console.log(blob);

        // // Create an object URL
        // const url = URL.createObjectURL(blob);

        // // Download file
        // download(url, 'users.json');

        // // Release the object URL
        // URL.revokeObjectURL(url);
    })
    .catch(err => console.error(err));
  }

  async function ConnectWallet(){
    const provider=new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner()
    setAddress(await signer.getAddress());
    // read();
    try{
      const response=await getProfile(await signer.getAddress());
      intializeBundlr()
      setprofileId(response.data.defaultProfile.id);
      setHandle(response.data.defaultProfile.handle);
      setfollowNftAddress(response.data.defaultProfile.followNftAddress);
      console.log(parseInt(response.data.defaultProfile.id))
    }
    catch(error){
      alert("You do not have a Lens Profile");
    }
  }

  async function gate(){

    const metadata = {
      version: '2.0.0',
      content: text,
      description: "This is a gated post!",
      name: `Post by @${handle}`,
      external_url: `https://lenster.xyz/u/${handle}`,
      metadata_id: uuid(),
      mainContentFocus: 'TEXT_ONLY',
      attributes: [],
      locale: 'en-US',
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum)
  


    let accessCondition = {
      contractAddress:followNftAddress,
      chainID: 80001
    }
    let condition = {}

    const sdk = await LensGatedSDK.create({
      provider: new ethers.providers.Web3Provider(window.ethereum),
      signer: provider.getSigner(),
      env: LensEnvironment.Mumbai
    })
    accessCondition.contractType = ContractType.Erc721
    condition = {
      nft: accessCondition
    }
    const { contentURI, encryptedMetadata } = await sdk.gated.encryptMetadata(
      metadata,
      profileId,
      {
       ...condition
      },
      async function(EncryptedMetadata) {
        // your ipfs function to add data
        const data=JSON.stringify(EncryptedMetadata);
        const si=byteSize(data)
        // await fundWallet(si)
        const res=await uploadFile(data);
        return res
      },)
   
      return contentURI;
  }

 

  async function post(){
    const content=await gate();
    const tx=await LensHub(profileId,content);
    console.log(tx);
  }



  async function fundWallet(size) {
    const price1MBAtomic = await bundlrInstance.getPrice(size);
    const price1MBConverted = bundlrInstance.utils.unitConverter(price1MBAtomic);
    console.log(`Uploading ${size} bytes to Bundlr costs $${price1MBConverted}`);
    const amountParsed = parseInput(price1MBConverted)
    let response = await bundlrInstance.fund(amountParsed)
    console.log('Wallet funded: ', response)
    fetchBalance()
  }

  function parseInput(input){
    const conv=new BigNumber(input).multipliedBy(bundlrInstance.currencyConfig.base[1]);
    if(conv.isLessThan(1)){
      console.log("error: value is too small")
      return
    }else{
      return conv
    }
  }

  // async function getEstimate(){
  //   const price1MBAtomic = await bundlrInstance.getPrice(size);
  //   const price1MBConverted = bundlrInstance.utils.unitConverter(price1MBAtomic);
  //   console.log(`Uploading ${size} bytes to Bundlr costs $${price1MBConverted}`);
  // }

  //http://arweave.net/v0HUztRB584k4IupM7j92u5f1ozXa4FNq5JMdGGaNBU

  async function decrypt(){
    const conn=read();
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner()
    const sdk = await LensGatedSDK.create({
      provider: new ethers.providers.Web3Provider(window.ethereum),
      signer: provider.getSigner(),
      env: LensEnvironment.Mumbai
    })

    const data=await fetch("http://arweave.net/v0HUztRB584k4IupM7j92u5f1ozXa4FNq5JMdGGaNBU");
    const final_data=JSON.parse(await data.text());


    const { decrypted } = await sdk.gated.decryptMetadata(final_data);
    console.log({ decrypted })
  }
  
  function onFileChange(e) {
    const file = e.target.files[0];
    console.log(file.size);
    setSize(file.size);
    if (file) {
      const image = URL.createObjectURL(file)
      setimage(image)
      console.log(image);
      let reader = new FileReader()
      reader.onload = function () {
        if (reader.result) {
          seFile(Buffer.from(reader.result))
          console.log(Buffer.from(reader.result))
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  async function uploadFile(data) {    
    let tx = await bundlrInstance.uploader.upload(data)
    console.log('tx: ', tx)
    setURI(`http://arweave.net/${tx.data.id}`)
    return `http://arweave.net/${tx.data.id}`

  }
  

  function onChange(e) {
    setText(e.target.value)
  }
 
  


  return (
  <div  style={containerStyle}>
    {
      !address && <div>
        <button onClick={() =>ConnectWallet()}>ConnectWallet</button>
      </div>
    }
  
    {
      profileId && (
        <div>
          <h3>Balance: {balance}</h3>
          <div style={{padding:"30px 0px"}}>
              {/* <input placeholder="Amount to fund the wallet" onChange={e=>setAmount(e.target.value)}/> */}
              {/* <button onClick={fundWallet}>Fund Wallet</button> */}
          </div>
          {/* <input type="file" onChange={onFileChange}/> */}
          <textarea
              onChange={onChange}
              placeholder="Encrypted post content"
            />
          {/* <button onClick={uploadFile}>Upload File</button> */}
          {/* <button onClick={() =>gate()}>Gate</button> */}
          {/* <button onClick={() =>getEstimate()}>Estimate</button> */}
          <button onClick={() =>post()}>Post</button>
          <button onClick={() =>decrypt()}>decrypt</button>
          {
            image && <img src={image} style={{width:"500px"}}/>
          }
          {
            URI && <a href={URI}>{URI}</a>
          }
        </div>
      )
    }
  </div>
  )
}

const containerStyle = {
  padding: '100px 20px'
}