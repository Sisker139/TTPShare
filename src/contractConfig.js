// src/contractConfig.js
export const CONTRACT_ADDRESS = "0x305ee005e978Eb2bd25F11fC0C2147091e79403d"; // TODO: thay bằng địa chỉ thật

export const CONTRACT_ABI = [
  // nextDocumentId()
  {
    "inputs": [],
    "name": "nextDocumentId",
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
  }
];
