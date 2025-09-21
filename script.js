// ABI & Contract Address
const contractAddress = "0xf7a9Ac1aA90C914676dDC778cE85250745223F2E";
const contractABI = [
  { "inputs": [], "name": "clearRecords", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "gm", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_limit", "type": "uint256" }], "name": "setRecentLimit", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_offset", "type": "uint256" }], "name": "setTzOffsetSeconds", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "slotId", "type": "uint256" } ], "name": "GMSaid", "type": "event" },
  { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "currentSlotId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getGMCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getLastSlot", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "count", "type": "uint256" }], "name": "getRecentGMs", "outputs": [{ "components": [ { "internalType": "address", "name": "user", "type": "address" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "internalType": "uint256", "name": "slotId", "type": "uint256" } ], "internalType": "struct GM.GMRecord[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "nextAllowedInfo", "outputs": [ { "internalType": "uint256", "name": "nextSlotId", "type": "uint256" }, { "internalType": "uint256", "name": "nextSlotStartTimestamp", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "recentLimit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "tzOffsetSeconds", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

let provider, signer, contract;
let transactions = [];

// DOM Elements
const connectBtn = document.getElementById("connectBtn");
const userAddressEl = document.getElementById("userAddress");
const gmBtn = document.getElementById("gmBtn");
const gmCountEl = document.getElementById("gmCount");
const recentList = document.getElementById("recentList");
const viewTxBtn = document.getElementById("viewTxBtn");
const txModal = document.getElementById("txModal");
const closeModal = document.querySelector(".close");
const txList = document.getElementById("txList");

// Helper: short address
function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Format timestamp
function formatTime(ts) {
  const date = new Date(ts * 1000);
  return date.toLocaleString();
}

// Connect Wallet
connectBtn.onclick = async () => {
  if (typeof window.ethereum !== "undefined") {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const address = await signer.getAddress();
    userAddressEl.textContent = shortAddress(address);
    document.getElementById("mainUI").style.display = "block";
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    loadData(address);
  } else {
    alert("MetaMask not detected!");
  }
};

// GM Transaction
gmBtn.onclick = async () => {
  try {
    const tx = await contract.gm();
    const receipt = await tx.wait();
    const address = await signer.getAddress();
    transactions.push({ address, timestamp: Math.floor(Date.now() / 1000) });
    loadData(address);
  } catch (err) {
    console.error(err);
  }
};

// Load Data
async function loadData(address) {
  const count = await contract.getGMCount(address);
  gmCountEl.textContent = count.toString();

  const recents = await contract.getRecentGMs(5);
  recentList.innerHTML = "";
  recents.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${shortAddress(r.user)} - ${formatTime(r.timestamp)}`;
    recentList.appendChild(li);
  });
}

// Modal Events
viewTxBtn.onclick = () => {
  txList.innerHTML = "";
  transactions.forEach(t => {
    const p = document.createElement("p");
    p.textContent = `${shortAddress(t.address)} - ${formatTime(t.timestamp)}`;
    txList.appendChild(p);
  });
  txModal.style.display = "block";
};

closeModal.onclick = () => {
  txModal.style.display = "none";
};

window.onclick = (event) => {
  if (event.target == txModal) {
    txModal.style.display = "none";
  }
};
