// ABI & Contract Address
const contractAddress = "0xf7a9Ac1aA90C914676dDC778cE85250745223F2E";
const contractABI = [
{
		"inputs": [],
		"name": "clearRecords",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "gm",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_limit",
				"type": "uint256"
			}
		],
		"name": "setRecentLimit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_offset",
				"type": "uint256"
			}
		],
		"name": "setTzOffsetSeconds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "slotId",
				"type": "uint256"
			}
		],
		"name": "GMSaid",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "currentSlotId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getGMCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getLastSlot",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "count",
				"type": "uint256"
			}
		],
		"name": "getRecentGMs",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "user",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "slotId",
						"type": "uint256"
					}
				],
				"internalType": "struct GM.GMRecord[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "nextAllowedInfo",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "nextSlotId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "nextSlotStartTimestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "recentLimit",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "tzOffsetSeconds",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
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
const faucetBtn = document.getElementById("faucetBtn");

// Helper: short address
function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Format timestamp
function formatTime(ts) {
  const date = new Date(ts * 1000);
  return date.toLocaleString();
}

// Connect / Disconnect Wallet
let connected = false;
connectBtn.onclick = async () => {
  if (!connected) {
    if (typeof window.ethereum !== "undefined") {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      const address = await signer.getAddress();
      userAddressEl.textContent = shortAddress(address);
      document.getElementById("mainUI").style.display = "block";
      contract = new ethers.Contract(contractAddress, contractABI, signer);
      loadData(address);
      connected = true;
      connectBtn.textContent = "Disconnect Wallet";
    } else {
      alert("MetaMask not detected!");
    }
  } else {
    signer = null;
    provider = null;
    contract = null;
    transactions = [];
    userAddressEl.textContent = "";
    document.getElementById("mainUI").style.display = "none";
    connectBtn.textContent = "Connect Wallet";
    connected = false;
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
}

// Faucet Button
faucetBtn.onclick = () => {
  window.open("https://faucet.zenchain.io", "_blank");
};

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

// Countdown Timer (Display only)
function updateCountdown() {
  const now = new Date();
  const utcOffset = 3.5 * 60; // Tehran UTC+3:30 in minutes
  const tehranTime = new Date(now.getTime() + (utcOffset - now.getTimezoneOffset()) * 60000);

  let nextReset = new Date(tehranTime);
  const hours = tehranTime.getHours();
  if (hours < 12) {
    nextReset.setHours(12, 0, 0, 0);
  } else {
    nextReset.setHours(24, 0, 0, 0);
  }

  const diff = nextReset - tehranTime;
  const h = Math.floor(diff / 1000 / 3600);
  const m = Math.floor((diff / 1000 % 3600) / 60);
  const s = Math.floor(diff / 1000 % 60);

  document.getElementById("countdown").textContent = `Next GM reset in: ${h}h ${m}m ${s}s`;
}

// Start countdown
setInterval(updateCountdown, 1000);
updateCountdown();
