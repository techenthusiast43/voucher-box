const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, customer] = await hre.ethers.getSigners();
  const configPath = path.join(__dirname, "..", "src", "contracts", "contractConfig.json");

  if (!fs.existsSync(configPath)) {
    console.error("❌ contractConfig.json not found. Please deploy first.");
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  if (!config.address) {
    console.error("❌ No contract address in contractConfig.json");
    return;
  }

  console.log("Seeding demo campaigns to contract at:", config.address);
  const voucherBox = await hre.ethers.getContractAt("VoucherBox", config.address, deployer);

  const now = Math.floor(Date.now() / 1000);
  const twoWeeks = now + 14 * 86400;
  const thirtyDays = now + 30 * 86400;

  // 1. Summer Café 20% Discount
  console.log("Creating Campaign 1: Coffee Lab 20% Discount...");
  let tx = await voucherBox.createCampaign(
    "Coffee Lab – 20% Off Artisanal Brews",
    0, // Percentage
    20, // 20%
    50, // max 50 claims
    twoWeeks
  );
  await tx.wait();

  // 2. Tech Haven 15 BOT Off
  console.log("Creating Campaign 2: Tech Haven 15 BOT Voucher...");
  tx = await voucherBox.createCampaign(
    "Tech Haven – 15 BOT Flat Discount",
    1, // Fixed
    15, // 15 BOT
    30, // max 30 claims
    thirtyDays
  );
  await tx.wait();

  // 3. Bistro VIP 30% Off
  console.log("Creating Campaign 3: Bistro Gourmet 30% VIP Pass...");
  tx = await voucherBox.createCampaign(
    "Bistro Gourmet – 30% VIP Dining Experience",
    0, // Percentage
    30, // 30%
    25, // max 25 claims
    twoWeeks
  );
  await tx.wait();

  console.log("✅ Successfully seeded 3 sample campaigns on-chain!");
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exitCode = 1;
});

