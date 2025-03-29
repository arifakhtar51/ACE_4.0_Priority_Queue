import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useDonations } from '../contexts/DonationContext'; // Import the context

// Array of NFT images
const NFT_IMAGES = [
  "/NFT_IMAGES/nft1.jpg",
  "/NFT_IMAGES/nft2.jpg",
  "/NFT_IMAGES/nft3.jpg",
  "/NFT_IMAGES/nft4.jpg",
  "/NFT_IMAGES/nft5.jpg",
  "/NFT_IMAGES/nft6.jpg",
  "/NFT_IMAGES/nft7.jpg",
  "/NFT_IMAGES/nft8.jpg",
  "/NFT_IMAGES/nft9.jpg",
  "/NFT_IMAGES/nft10.jpg"
];

export function VerifyDonation() {
  const navigate = useNavigate();
  const { addDonation } = useDonations(); // Get the addDonation function from context
  const [formData, setFormData] = useState({
    donorName: '',
    donorId: '',
    bloodType: 'O+',
    amount: '',
    notes: ''
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const generateNFTImage = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const randomIndex = Math.floor(Math.random() * NFT_IMAGES.length);
    setSelectedImage(NFT_IMAGES[randomIndex]);
    setIsGenerating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      alert("Please generate an NFT image first!");
      return;
    }
    setIsVerifying(true);
    
    try {
      const metadata = {
        name: "LifeNFT Blood Donation Badge",
        description: "NFT awarded for blood donation",
        image: selectedImage,
        attributes: {
          donorId: formData.donorId,
          donorName: formData.donorName,
          bloodType: formData.bloodType,
          amount: formData.amount,
          notes: formData.notes,
          timestamp: new Date().toISOString()
        }
      };

      const pinataJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5OTMyNjE0OC1hMzIzLTQ0YzItYjUwNi00MTU0YTNiMTNmMzMiLCJlbWFpbCI6ImFyaWZha2h0YXI5MDJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImY4NGUyNWIzYzgyYjY1ZTAzOGExIiwic2NvcGVkS2V5U2VjcmV0IjoiOWRjODM2Yzk5OTNiMTg2Zjg0ZTQ3MWQ5ZmU1ZDE2ZTY3YzE0ZDIwZTczNTlkNGU0ODJmODVkMjFkNWNkMDdmNiIsImV4cCI6MTc3MjgyNzM3NX0.tFYF935D4sJDZY98sLj1rK9lC2NOrk-x9f2lYjXHpgQ";

      const pinataResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${pinataJWT}`
          }
        }
      );

      const ipfsHash = pinataResponse.data.IpfsHash;
      setIpfsHash(ipfsHash);

      const customJson = {
        id: "life_nft",
        json: JSON.stringify({
          nft_type: "LifeNFT",
          donor_id: formData.donorId,
          donor_name: formData.donorName,
          blood_type: formData.bloodType,
          amount: formData.amount,
          notes: formData.notes,
          ipfs_hash: ipfsHash,
          timestamp: new Date().toISOString(),
          tx_id: uuidv4()
        }),
        required_auths: [],
        required_posting_auths: [formData.donorId]
      };

      if (window.hive_keychain) {
        window.hive_keychain.requestCustomJson(
          formData.donorId,
          customJson.id,
          "Posting",
          customJson.json,
          "Issue Blood Donation NFT",
          (response) => {
            if (response.success) {
              setTransactionStatus("NFT issued successfully on Hive!");
              const newTransaction = {
                id: uuidv4(),
                donorName: formData.donorName,
                bloodType: formData.bloodType,
                donationDate: new Date().toISOString(),
                nftIssued: true,
                verifiedBy: "Your Name" // Replace with actual verifier
              };

              // Add the transaction to the hospital dashboard
              addDonation(newTransaction); // Add the new transaction to the context
              navigate('/hospital-dashboard'); // Redirect to the dashboard
            } else {
              setTransactionStatus("Transaction failed: " + response.message);
            }
            setIsVerifying(false);
          }
        );
      } else {
        alert("Hive Keychain extension is required!");
        setIsVerifying(false);
      }

    } catch (error) {
      console.error("Error:", error);
      setTransactionStatus("Error in processing transaction.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Verify Blood Donation</h1>
        <p className="mt-2 text-slate-400">Record a new blood donation and issue an NFT to the donor</p>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-8 border border-slate-700 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Donor Name</label>
              <input 
                type="text"
                name="donorName"
                value={formData.donorName}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Donor ID / Wallet Address</label>
              <input 
                type="text"
                name="donorId"
                value={formData.donorId}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Blood Type</label>
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Amount (ml)</label>
              <input 
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>

          {/* NFT Image Generation Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-300">NFT Image</label>
              <button
                type="button"
                onClick={generateNFTImage}
                disabled={isGenerating}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating..." : "Generate NFT Image"}
              </button>
            </div>
            
            {isGenerating ? (
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-purple-500 bg-slate-800/50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-purple-400 animate-pulse">Generating unique NFT image...</p>
                </div>
              </div>
            ) : selectedImage && (
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-purple-500">
                <img
                  src={selectedImage}
                  alt="Generated NFT"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          
          <button type="submit" className="w-full p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg" disabled={isVerifying || !selectedImage || isGenerating}>
            {isVerifying ? "Verifying..." : "Verify & Issue NFT"}
          </button>
        </form>
      </div>
    </div>
  );
}
