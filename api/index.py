from flask import Flask, jsonify
from flask_cors import CORS
from web3 import Web3
import json
import os

app = Flask(__name__)
CORS(app)

# IMPORTANT: For Vercel, use a real RPC URL (Infura or Alchemy) 
# Localhost (127.0.0.1) will NOT work on the internet.
RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/Yg2XWKjbbgVc2T2kiuk9g" 
w3 = Web3(Web3.HTTPProvider(RPC_URL))
CONTRACT_ADDRESS = "0xEfF34463662089fF20569E7AAa443892d0cF16D2"

# Get the path to abi.json inside the api folder
abi_path = os.path.join(os.path.dirname(__file__), "abi.json")
with open(abi_path) as f:
    CONTRACT_ABI = json.load(f)

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

@app.route('/api/shipments/<address>', methods=['GET'])
def get_user_shipments(address):
    try:
        checksum_address = w3.to_checksum_address(address)
        raw_shipments = contract.functions.getShipments(checksum_address).call()
        shipments = []
        for s in raw_shipments:
            shipments.append({
                "sender": s, "receiver": s, "pickupTime": s,
                "deliveryTime": s, "distance": s,
                "price": str(w3.from_wei(s, 'ether')),
                "isPaid": s, "isDelivered": s
            })
        return jsonify(shipments)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Vercel needs this
def handler(event, context):
    return app(event, context)