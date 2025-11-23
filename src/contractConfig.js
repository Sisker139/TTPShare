// src/contractConfig.js

// ⚠️ THAY bằng địa chỉ contract MỚI sau khi bạn deploy lại DocumentPlatform đã sửa
export const CONTRACT_ADDRESS = "0x9285Bc4E002978a96f79aFe9764A4aE9Ef908439";

export const CONTRACT_ABI = [
  // nextDocumentId()
  {
    "inputs": [],
    "name": "nextDocumentId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  // owner()
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },

  // LIKE_TARGET()
  {
    "inputs": [],
    "name": "LIKE_TARGET",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  // REWARD_AMOUNT()
  {
    "inputs": [],
    "name": "REWARD_AMOUNT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  // documents(uint256)
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "documents",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "address payable", "name": "author", "type": "address" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "fileHash", "type": "string" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint256", "name": "likeCount", "type": "uint256" },
      { "internalType": "uint256", "name": "purchaseCount", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // rewardClaimed(uint256)
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "rewardClaimed",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },

  // userHasAccess(uint256,address)
  {
    "inputs": [
      { "internalType": "uint256", "name": "_docId", "type": "uint256" },
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "userHasAccess",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },

  // getRewardPoolBalance()
  {
    "inputs": [],
    "name": "getRewardPoolBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  // uploadDocument(string,string,string,uint256)
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "string", "name": "_fileHash", "type": "string" },
      { "internalType": "uint256", "name": "_price", "type": "uint256" }
    ],
    "name": "uploadDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // likeDocument(uint256)
  {
    "inputs": [{ "internalType": "uint256", "name": "_docId", "type": "uint256" }],
    "name": "likeDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // buyDocument(uint256) payable
  {
    "inputs": [{ "internalType": "uint256", "name": "_docId", "type": "uint256" }],
    "name": "buyDocument",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },

  // claimReward(uint256)
  {
    "inputs": [{ "internalType": "uint256", "name": "_docId", "type": "uint256" }],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // depositReward() payable (owner nạp thêm quỹ thưởng nếu muốn)
  {
    "inputs": [],
    "name": "depositReward",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];
