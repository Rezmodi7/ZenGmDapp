// --- Config ---
const contractAddress = "0xf7a9Ac1aA90C914676dDC778cE85250745223F2E";
const contractABI = [
	{"inputs":[],"name":"clearRecords","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[],"name":"gm","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[{"internalType":"uint256","name":"_limit","type":"uint256"}],"name":"setRecentLimit","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[{"internalType":"uint256","name":"_offset","type":"uint256"}],"name":"setTzOffsetSeconds","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
	{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"slotId","type":"uint256"}],"name":"GMSaid","type":"event"},
	{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[],"name":"currentSlotId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getGMCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getLastSlot","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"name":"getRecentGMs","outputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"uint256","name":"slotId","type":"uint256"}],"internalType":"struct GM.GMRecord[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"nextAllowedInfo","outputs":[{"internalType":"uint256","name":"nextSlotId","type":"uint256"},{"internalType":"uint256","name":"nextSlotStartTimestamp","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"recentLimit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"tzOffsetSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

let provider, signer, contract, userAddress;

// DOM Elements
const connectBtn = document.getElementById("connectBtn");
const gmBtn = document.getElementById("gmBtn");
const userAddressSpan = document.getElementById("userAddress");
const gmCountSpan = document.getElementById("gmCount");
const countdownP = document.getElementById("countdown");
const recentList = document.getElementById("recentList");
const faucetBtn = document.getElementById("faucetBtn");

// Connect wallet
connectBtn.onclick = async () => {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    userAddressSpan.textContent = userAddress;
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    document.getElementById("mainUI").style.display = "block";
    connectBtn.style.display = "none";

    refreshData();
  } else {
    alert("Please install MetaMask or compatible wallet.");
  }
};

// GM button
gmBtn.onclick = async () => {
  try {
    let tx = await contract.gm();
    await tx.wait();
    alert("GM sent!");
    refreshData();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

// Faucet button
faucetBtn.onclick = () => {
  window.open("https://faucet.zenchain.io", "_blank");
};

// Refresh data
async function refreshData() {
  if (!contract) return;

  // GM count
  let count = await contract.getGMCount(userAddress);
  gmCountSpan.textContent = count.toString();

  // Recent GMs
  let recents = await contract.getRecentGMs(10);
  recentList.innerHTML = "";
  recents.forEach((r) => {
    let li = document.createElement("li");
    let d = new Date(r.timestamp * 1000);
    li.textContent = `${r.user} - ${d.toLocaleString()}`;
    recentList.appendChild(li);
  });

  // Countdown
  let info = await contract.nextAllowedInfo(userAddress);
  let nextSlotStart = info.nextSlotStartTimestamp.toNumber() * 1000;
  updateCountdown(nextSlotStart);
}

// Countdown updater
function updateCountdown(nextSlotStart) {
  function tick() {
    let now = Date.now();
    let diff = nextSlotStart - now;
    if (diff <= 0) {
      countdownP.textContent = "You can GM now!";
      gmBtn.disabled = false;
    } else {
      let hours = Math.floor(diff / (1000 * 60 * 60));
      let minutes = Math.floor((diff / (1000 * 60)) % 60);
      let seconds = Math.floor((diff / 1000) % 60);
      countdownP.textContent = `Next GM available in ${hours}h ${minutes}m ${seconds}s`;
      gmBtn.disabled = true;
    }
  }
  tick();
  setInterval(tick, 1000);
}
