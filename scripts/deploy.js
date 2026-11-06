const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("==================================================");
  console.log("🚀 Deploying VoucherBox to BOT Chain...");
  console.log("Network Name   :", network.name);
  console.log("Chain ID       :", network.chainId.toString());
  console.log("Deployer Wallet:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "BOT");
  console.log("==================================================");

  const VoucherBox = await hre.ethers.getContractFactory("VoucherBox");
  const voucherBox = await VoucherBox.deploy();
  await voucherBox.waitForDeployment();

  const contractAddress = await voucherBox.getAddress();
  console.log("✅ VoucherBox successfully deployed at:", contractAddress);

  let explorerBase = "https://scan.bohr.life";
  if (Number(network.chainId) === 677) {
    explorerBase = "https://scan.botchain.ai";
  }
  console.log(`🔍 View on Explorer: ${explorerBase}/address/${contractAddress}`);

  // Create src/contracts directory if it doesn't exist
  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Export contract config
  const contractArtifact = await hre.artifacts.readArtifact("VoucherBox");

  const configData = {
    address: contractAddress,
    chainId: Number(network.chainId),
    networkName: Number(network.chainId) === 968 ? "BOT Chain Testnet" : (Number(network.chainId) === 677 ? "BOT Chain Mainnet" : network.name),
    deployedAt: new Date().toISOString(),
    explorerUrl: `${explorerBase}/address/${contractAddress}`
  };

  fs.writeFileSync(
    path.join(contractsDir, "contractConfig.json"),
    JSON.stringify(configData, null, 2)
  );

  fs.writeFileSync(
    path.join(contractsDir, "VoucherBoxABI.json"),
    JSON.stringify(contractArtifact.abi, null, 2)
  );

  // Auto-update VITE_CONTRACT_ADDRESS in .env if .env exists
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("VITE_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /VITE_CONTRACT_ADDRESS=.*/,
        `VITE_CONTRACT_ADDRESS=${contractAddress}`
      );
      fs.writeFileSync(envPath, envContent);
      console.log("📝 Auto-updated VITE_CONTRACT_ADDRESS in .env");
    }
  }

  console.log("📄 Exported contract config & ABI to src/contracts/");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

