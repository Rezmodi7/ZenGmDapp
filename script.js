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

let provider = null;
let signer = null;
let contract = null;
let readOnlyProvider = null;
let readOnlyContract = null;

let connected = false;
let accountsChangedHandler = null;

// DOM
const connectBtn = document.getElementById("connectBtn");
const userAddressEl = document.getElementById("userAddress");
const gmBtn = document.getElementById("gmBtn");
const gmCountEl = document.getElementById("gmCount");
const viewTxBtn = document.getElementById("viewTxBtn");
const txModal = document.getElementById("txModal");
const closeModal = document.querySelector(".close");
const txList = document.getElementById("txList");
const faucetBtn = document.getElementById("faucetBtn");

// helper: short
function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// helper: format timestamp (accepts BigNumber or number)
function formatTime(ts) {
  let tnum;
  try {
    if (ts && typeof ts.toNumber === "function") tnum = ts.toNumber();
    else tnum = Number(ts);
  } catch (e) {
    tnum = Number(ts);
  }
  if (!tnum) return "-";
  return new Date(tnum * 1000).toLocaleString();
}

// create read-only provider now so modal works even when wallet not connected
(function initReadOnly() {
  try {
    // ZenChain Testnet public RPC from earlier convo
    readOnlyProvider = new ethers.providers.JsonRpcProvider("https://zenchain-testnet.api.onfinality.io/public");
    readOnlyContract = new ethers.Contract(contractAddress, contractABI, readOnlyProvider);
  } catch (e) {
    console.warn("read-only provider init failed:", e);
  }
})();

// --- Connect / Disconnect (local)
async function doConnect() {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask (or compatible wallet) not found.");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(contractAddress, contractABI, signer);

  const address = await signer.getAddress();
  userAddressEl.textContent = shortAddress(address);
  document.getElementById("mainUI").style.display = "block";

  // listen for account changes
  accountsChangedHandler = (accounts) => {
    if (!accounts || accounts.length === 0) {
      // wallet locked/disconnected from UI -> do local disconnect
      doDisconnect();
    } else {
      // update shown address
      userAddressEl.textContent = shortAddress(accounts[0]);
      loadGMCount(accounts[0]).catch(console.error);
    }
  };
  if (window.ethereum && accountsChangedHandler) {
    try { window.ethereum.on("accountsChanged", accountsChangedHandler); } catch(e){ /* some wallets */ }
  }

  connected = true;
  connectBtn.textContent = "Disconnect Wallet";

  // load initial data
  loadGMCount(address).catch(console.error);
}

function doDisconnect() {
  // remove listeners
  if (window.ethereum && accountsChangedHandler) {
    try { window.ethereum.removeListener("accountsChanged", accountsChangedHandler); } catch(e){ /* ignore */ }
  }
  accountsChangedHandler = null;

  // clear local vars & UI
  provider = null;
  signer = null;
  contract = null;
  connected = false;
  userAddressEl.textContent = "";
  document.getElementById("mainUI").style.display = "none";
  connectBtn.textContent = "Connect Wallet";
}

// toggle connect
connectBtn.onclick = async () => {
  if (!connected) {
    await doConnect();
  } else {
    doDisconnect();
  }
};

// --- GM action (keeps behavior as before)
gmBtn.onclick = async () => {
  if (!contract) {
    alert("Please connect your wallet first.");
    return;
  }
  try {
    const tx = await contract.gm();
    await tx.wait();
    // update count after successful tx
    const address = await signer.getAddress();
    await loadGMCount(address);
    alert("GM recorded on chain ✅");
  } catch (e) {
    console.error(e);
    alert("Transaction failed: " + (e && e.message ? e.message : e));
  }
};

// load gm count for address
async function loadGMCount(address) {
  try {
    if (!contract) {
      // if wallet not connected, use read-only contract
      const c = readOnlyContract;
      if (!c) return;
      const count = await c.getGMCount(address);
      gmCountEl.textContent = (count && count.toString) ? count.toString() : String(Number(count) || 0);
    } else {
      const count = await contract.getGMCount(address);
      gmCountEl.textContent = (count && count.toString) ? count.toString() : String(Number(count) || 0);
    }
  } catch (e) {
    console.error("loadGMCount error:", e);
  }
}

// View Transactions: use read-only contract so works without wallet too
viewTxBtn.onclick = async () => {
  txList.innerHTML = "";
  try {
    const c = readOnlyContract || contract;
    if (!c) {
      txList.innerHTML = "<p>Cannot load contract data.</p>";
    } else {
      // request up to 50 recent GMs (contract enforces its recentLimit)
      const recents = await c.getRecentGMs(50);
      if (!recents || recents.length === 0) {
        txList.innerHTML = "<p>No GM records yet.</p>";
      } else {
        // recents expected to be returned most-recent-first (as contract implemented)
        recents.forEach(r => {
          const p = document.createElement("p");
          const user = r.user || r[0];
          const ts = r.timestamp || r[1];
          p.textContent = `${shortAddress(String(user))} — ${formatTime(ts)}`;
          txList.appendChild(p);
        });
      }
    }
  } catch (e) {
    console.error("Failed to load recent GMs:", e);
    txList.innerHTML = "<p>Error loading records.</p>";
  }
  txModal.style.display = "block";
};

// modal close handlers
closeModal.onclick = () => { txModal.style.display = "none"; };
window.onclick = (event) => { if (event.target === txModal) txModal.style.display = "none"; };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") txModal.style.display = "none"; });

// Faucet button
faucetBtn.onclick = () => {
  window.open("https://faucet.zenchain.io", "_blank");
};

// -------- Countdown (Display only) --------
// returns Date object for "now" in Tehran (UTC+3:30)
function getTehranNow() {
  const now = new Date();
  // now.getTimezoneOffset() returns minutes to add to local time to get UTC
  // utcMs = now + offset*60000
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const tehranOffsetMin = 3.5 * 60; // +3:30 => 210 minutes
  const tehranMs = utcMs + tehranOffsetMin * 60000;
  return new Date(tehranMs);
}

function updateCountdownDisplay() {
  const tehranNow = getTehranNow();
  const hrs = tehranNow.getHours();

  let nextReset = new Date(tehranNow);
  if (hrs < 12) {
    // same day at 12:00
    nextReset.setHours(12, 0, 0, 0);
  } else {
    // next reset at 00:00 (midnight) i.e., set to 24:00 of today -> this rolls to next day 00:00
    nextReset.setHours(24, 0, 0, 0);
  }

  const diffMs = nextReset.getTime() - tehranNow.getTime();
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const el = document.getElementById("countdown");
  if (el) el.textContent = `Next GM reset (Tehran) in: ${h}h ${m}m ${s}s`;
}

// start countdown (display only)
setInterval(updateCountdownDisplay, 1000);
updateCountdownDisplay();

// On load: try to show read-only recent count if user not connected (optional)
(async function initialTryCount() {
  try {
    // no address to query count for, so skip
  } catch (e) {
    console.warn(e);
  }
})();
