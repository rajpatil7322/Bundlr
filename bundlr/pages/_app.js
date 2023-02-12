import '@/styles/globals.css'
import {providers,utils} from "ethers";
import { WebBundlr } from '@bundlr-network/client';
import { useState,useRef } from 'react';
import { MainContext } from '@/context';

export default function App({ Component, pageProps }) {
  const [bundlrInstance,setbundlrInstance]=useState();
  const [balance,setbalance]=useState();

  const bundlrRef=useRef()

  async function initialize(){
    await window.ethereum.enable();
    const provider=new providers.Web3Provider(window.ethereum);
    await provider._ready()

    const bundlr=new WebBundlr("https://devnet.bundlr.network","matic",provider);
    await bundlr.ready();
    setbundlrInstance(bundlr);
    bundlrRef.current=bundlr;
    fetchBalance();
  }

  async function fetchBalance(){
    const bal=await bundlrRef.current.getLoadedBalance();
    console.log('bal: ',utils.formatEther(bal.toString()))
    setbalance(utils.formatEther(bal.toString()))
  }
  return (
    <div style={containerStyle}>
      <MainContext.Provider
      value={{
        initialize,
        fetchBalance,
        balance,
        bundlrInstance
      }}>
      <Component {...pageProps}/>
      </MainContext.Provider>
    </div>
  )
}

const containerStyle = {
  padding: '40px',
  width:"900px",
  margin:"0 auto"
}
