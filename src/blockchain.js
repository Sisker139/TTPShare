// src/blockchain.js
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig";

// Lấy provider từ MetaMask
export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("Vui lòng cài MetaMask trước.");
  }
  const provider = new BrowserProvider(window.ethereum);
  return provider;
}

// Yêu cầu connect ví, trả về địa chỉ ví
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("Vui lòng cài MetaMask trước.");
  }
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });
  return accounts[0];
}

// Tạo instance contract (dùng signer nếu cần gửi tx)
export async function getContract(withSigner = false) {
  const provider = await getProvider();
  if (withSigner) {
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  } else {
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }
}
