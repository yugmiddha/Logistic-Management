const contractAddress = "0xEfF34463662089fF20569E7AAa443892d0cF16D2";
// IMPORTANT: Ensure this is a single array [...] not [[...]]
const abi = [
    { "inputs": [{ "internalType": "address", "name": "_sender", "type": "address" }, { "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "completeShipment", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "_receiver", "type": "address" }, { "internalType": "uint256", "name": "_pickupTime", "type": "uint256" }, { "internalType": "uint256", "name": "_distance", "type": "uint256" }], "name": "createShipment", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getShipments", "outputs": [{ "components": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "uint256", "name": "pickupTime", "type": "uint256" }, { "internalType": "uint256", "name": "deliveryTime", "type": "uint256" }, { "internalType": "uint256", "name": "distance", "type": "uint256" }, { "internalType": "uint256", "name": "price", "type": "uint256" }, { "internalType": "bool", "name": "isPaid", "type": "bool" }, { "internalType": "bool", "name": "isDelivered", "type": "bool" }], "internalType": "struct Tracking.Shipment[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" }
];

let signer = null;
let userAddress = "";

async function connect() {
    // Check if the ethereum object exists in the window
    if (typeof window.ethereum !== 'undefined') {
        try {
            // This line specifically triggers the MetaMask popup
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            userAddress = await signer.getAddress();
            
            document.getElementById("walletDisplay").innerText = `Connected: ${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
            document.getElementById("connectBtn").innerText = "Wallet Linked";
            
            // Auto-load shipments once connected
            fetchFromBackend();
        } catch (err) {
            console.error("User denied account access or error occurred:", err);
            alert("Connection rejected. Please allow the request in MetaMask.");
        }
    } else {
        alert("MetaMask not detected! Please install the extension and refresh the page.");
    }
}

async function createNewShipment() {
    if (!signer) return alert("Please connect your wallet first!");

    // 1. Get values from HTML
    const receiver = document.getElementById("destAddr").value;
    const distance = document.getElementById("dist").value;
    const amount = document.getElementById("price").value;

    // 2. Validation
    if (!receiver || !distance || !amount) {
        return alert("Please fill in all fields (Receiver, Distance, and Price).");
    }

    try {
        const contract = new ethers.Contract(contractAddress, abi, signer);

        // 3. Convert Values
        // pickupTime = current time in seconds
        const pickupTime = Math.floor(Date.now() / 1000);
        
        // Convert distance string to a number/BigInt
        const distValue = BigInt(distance);
        
        // Convert ETH string to Wei
        const ethValue = ethers.parseEther(amount);

        console.log("Sending Transaction...", { receiver, pickupTime, distValue, ethValue });

        // 4. Call Contract
        const tx = await contract.createShipment(
            receiver, 
            pickupTime, 
            distValue, 
            { value: ethValue }
        );

        alert("Transaction sent! Waiting for confirmation...");
        await tx.wait();
        
        alert("Shipment Created Successfully!");
        
        // Refresh the list from Python backend
        fetchFromBackend();
        
    } catch (err) {
        console.error("Detailed Error:", err);
        // This helps you catch 'Insufficient Funds' or 'User Rejected'
        alert("Transaction failed! Check browser console (F12) for details.");
    }
}

async function fetchFromBackend() {
    if (!userAddress) return;
    // Change this line in fetchFromBackend()
    const response = await fetch(`/api/shipments/${userAddress}`);

    if (!response.ok) {
        console.error("Backend Error:", await response.text());
        return;
    }
    
    const data = await response.json();
    const listDiv = document.getElementById("list");
    listDiv.innerHTML = "";
    data.forEach((s, index) => {
    const statusClass = s.isDelivered ? "delivered" : "pending";
    const statusText = s.isDelivered ? "COMPLETED" : "IN TRANSIT";
    
    listDiv.innerHTML += `
        <div class="card">
            <div style="display:flex; justify-content:between; align-items:center;">
                <strong>Shipment #${index + 1}</strong>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <p style="font-size: 0.9em; color: #888;">To: ${s.receiver}</p>
            <p>💰 <b>${s.price} ETH</b> | 📍 <b>${s.distance} km</b></p>
        </div>`;
});
}

document.getElementById("connectBtn").addEventListener("click", connect);