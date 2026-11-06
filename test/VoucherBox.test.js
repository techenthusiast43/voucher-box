const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VoucherBox Contract", function () {
  let VoucherBox;
  let voucherBox;
  let owner, merchant, customer1, customer2, stranger;

  const DISCOUNT_PERCENTAGE = 0;
  const DISCOUNT_FIXED = 1;

  beforeEach(async function () {
    [owner, merchant, customer1, customer2, stranger] = await ethers.getSigners();

    VoucherBox = await ethers.getContractFactory("VoucherBox");
    voucherBox = await VoucherBox.deploy();
    await voucherBox.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should initialize with correct initial counters", async function () {
      expect(await voucherBox.nextCampaignId()).to.equal(1);
      expect(await voucherBox.nextVoucherId()).to.equal(1);
      expect(await voucherBox.getCampaignCount()).to.equal(0);
      expect(await voucherBox.getVoucherCount()).to.equal(0);
    });
  });

  describe("Campaign Creation", function () {
    it("should allow a merchant to create a valid campaign", async function () {
      const latestTime = await time.latest();
      const expiry = latestTime + 3600; // 1 hour later

      const tx = await voucherBox.connect(merchant).createCampaign(
        "Summer Special 20% Off",
        DISCOUNT_PERCENTAGE,
        20,
        50,
        expiry
      );

      await expect(tx)
        .to.emit(voucherBox, "CampaignCreated")
        .withArgs(1, merchant.address, "Summer Special 20% Off", DISCOUNT_PERCENTAGE, 20, 50, expiry);

      expect(await voucherBox.getCampaignCount()).to.equal(1);

      const campaign = await voucherBox.getCampaign(1);
      expect(campaign.name).to.equal("Summer Special 20% Off");
      expect(campaign.owner).to.equal(merchant.address);
      expect(campaign.discountType).to.equal(DISCOUNT_PERCENTAGE);
      expect(campaign.discountValue).to.equal(20);
      expect(campaign.maxClaims).to.equal(50);
      expect(campaign.claimedCount).to.equal(0);
      expect(campaign.redeemedCount).to.equal(0);
      expect(campaign.expiryDate).to.equal(expiry);
      expect(campaign.isCancelled).to.be.false;
    });

    it("should revert if campaign name is empty", async function () {
      const latestTime = await time.latest();
      await expect(
        voucherBox.connect(merchant).createCampaign("", DISCOUNT_PERCENTAGE, 10, 50, latestTime + 3600)
      ).to.be.revertedWithCustomError(voucherBox, "InvalidName");
    });

    it("should revert if max claims is zero", async function () {
      const latestTime = await time.latest();
      await expect(
        voucherBox.connect(merchant).createCampaign("Test", DISCOUNT_PERCENTAGE, 10, 0, latestTime + 3600)
      ).to.be.revertedWithCustomError(voucherBox, "InvalidMaxClaims");
    });

    it("should revert if expiry date is in the past", async function () {
      const latestTime = await time.latest();
      await expect(
        voucherBox.connect(merchant).createCampaign("Test", DISCOUNT_PERCENTAGE, 10, 50, latestTime - 100)
      ).to.be.revertedWithCustomError(voucherBox, "InvalidExpiryDate");
    });

    it("should revert if percentage discount exceeds 100", async function () {
      const latestTime = await time.latest();
      await expect(
        voucherBox.connect(merchant).createCampaign("Test", DISCOUNT_PERCENTAGE, 105, 50, latestTime + 3600)
      ).to.be.revertedWithCustomError(voucherBox, "InvalidPercentage");
    });
  });

  describe("Claiming Vouchers", function () {
    let campaignId;
    let expiry;

    beforeEach(async function () {
      const latestTime = await time.latest();
      expiry = latestTime + 3600;
      await voucherBox.connect(merchant).createCampaign(
        "Grand Opening $10 Off",
        DISCOUNT_FIXED,
        10,
        2, // max 2 claims
        expiry
      );
      campaignId = 1;
    });

    it("should allow a customer to claim a voucher", async function () {
      const tx = await voucherBox.connect(customer1).claimVoucher(campaignId);

      await expect(tx)
        .to.emit(voucherBox, "VoucherClaimed")
        .withArgs(1, campaignId, customer1.address, await time.latest());

      expect(await voucherBox.hasUserClaimed(campaignId, customer1.address)).to.be.true;

      const campaign = await voucherBox.getCampaign(campaignId);
      expect(campaign.claimedCount).to.equal(1);

      const userVouchers = await voucherBox.getUserVouchers(customer1.address);
      expect(userVouchers.length).to.equal(1);
      expect(userVouchers[0].voucherId).to.equal(1);
      expect(userVouchers[0].campaignId).to.equal(campaignId);
      expect(userVouchers[0].customer).to.equal(customer1.address);
      expect(userVouchers[0].isRedeemed).to.be.false;
    });

    it("should prevent a customer from claiming the same campaign twice", async function () {
      await voucherBox.connect(customer1).claimVoucher(campaignId);

      await expect(
        voucherBox.connect(customer1).claimVoucher(campaignId)
      ).to.be.revertedWithCustomError(voucherBox, "AlreadyClaimed");
    });

    it("should prevent claims when maxClaims has been reached", async function () {
      await voucherBox.connect(customer1).claimVoucher(campaignId);
      await voucherBox.connect(customer2).claimVoucher(campaignId);

      // 3rd customer tries to claim when max was 2
      await expect(
        voucherBox.connect(stranger).claimVoucher(campaignId)
      ).to.be.revertedWithCustomError(voucherBox, "MaxClaimsReached");
    });

    it("should prevent claims after expiry", async function () {
      await time.increaseTo(expiry + 1);

      await expect(
        voucherBox.connect(customer1).claimVoucher(campaignId)
      ).to.be.revertedWithCustomError(voucherBox, "CampaignIsExpired");
    });

    it("should prevent claims on cancelled campaigns", async function () {
      await voucherBox.connect(merchant).cancelCampaign(campaignId);

      await expect(
        voucherBox.connect(customer1).claimVoucher(campaignId)
      ).to.be.revertedWithCustomError(voucherBox, "CampaignIsCancelled");
    });
  });

  describe("Redeeming Vouchers", function () {
    let campaignId;
    let voucherId;
    let expiry;

    beforeEach(async function () {
      const latestTime = await time.latest();
      expiry = latestTime + 3600;
      await voucherBox.connect(merchant).createCampaign(
        "VIP Pass 50% Off",
        DISCOUNT_PERCENTAGE,
        50,
        10,
        expiry
      );
      campaignId = 1;

      // customer1 claims
      await voucherBox.connect(customer1).claimVoucher(campaignId);
      voucherId = 1;
    });

    it("should allow the campaign owner to redeem a valid voucher", async function () {
      const tx = await voucherBox.connect(merchant).redeemVoucher(voucherId);

      await expect(tx)
        .to.emit(voucherBox, "VoucherRedeemed")
        .withArgs(voucherId, campaignId, customer1.address, merchant.address, await time.latest());

      const [voucher, camp] = await voucherBox.getVoucher(voucherId);
      expect(voucher.isRedeemed).to.be.true;
      expect(voucher.redeemedAt).to.be.gt(0);
      expect(camp.redeemedCount).to.equal(1);
    });

    it("should revert if a non-owner tries to redeem", async function () {
      await expect(
        voucherBox.connect(stranger).redeemVoucher(voucherId)
      ).to.be.revertedWithCustomError(voucherBox, "NotCampaignOwner");
    });

    it("should revert if attempting to redeem an already redeemed voucher", async function () {
      await voucherBox.connect(merchant).redeemVoucher(voucherId);

      await expect(
        voucherBox.connect(merchant).redeemVoucher(voucherId)
      ).to.be.revertedWithCustomError(voucherBox, "VoucherAlreadyRedeemed");
    });

    it("should revert if attempting to redeem an expired campaign voucher", async function () {
      await time.increaseTo(expiry + 1);

      await expect(
        voucherBox.connect(merchant).redeemVoucher(voucherId)
      ).to.be.revertedWithCustomError(voucherBox, "CampaignIsExpired");
    });

    it("should revert if attempting to redeem a voucher for a cancelled campaign", async function () {
      await voucherBox.connect(merchant).cancelCampaign(campaignId);

      await expect(
        voucherBox.connect(merchant).redeemVoucher(voucherId)
      ).to.be.revertedWithCustomError(voucherBox, "CampaignIsCancelled");
    });
  });

  describe("Campaign Cancellation", function () {
    let campaignId;

    beforeEach(async function () {
      const latestTime = await time.latest();
      await voucherBox.connect(merchant).createCampaign(
        "Temporary Sale",
        DISCOUNT_PERCENTAGE,
        15,
        20,
        latestTime + 7200
      );
      campaignId = 1;
    });

    it("should allow the owner to cancel the campaign", async function () {
      const tx = await voucherBox.connect(merchant).cancelCampaign(campaignId);

      await expect(tx)
        .to.emit(voucherBox, "CampaignCancelled")
        .withArgs(campaignId, merchant.address, await time.latest());

      const campaign = await voucherBox.getCampaign(campaignId);
      expect(campaign.isCancelled).to.be.true;
    });

    it("should revert if a non-owner tries to cancel", async function () {
      await expect(
        voucherBox.connect(stranger).cancelCampaign(campaignId)
      ).to.be.revertedWithCustomError(voucherBox, "NotCampaignOwner");
    });

    it("should revert if cancelling an already cancelled campaign", async function () {
      await voucherBox.connect(merchant).cancelCampaign(campaignId);

      await expect(
        voucherBox.connect(merchant).cancelCampaign(campaignId)
      ).to.be.revertedWithCustomError(voucherBox, "CampaignIsCancelled");
    });
  });

  describe("View Functions", function () {
    it("should retrieve all campaigns and owner campaigns correctly", async function () {
      const latestTime = await time.latest();
      await voucherBox.connect(merchant).createCampaign("Camp 1", 0, 10, 5, latestTime + 1000);
      await voucherBox.connect(merchant).createCampaign("Camp 2", 1, 20, 10, latestTime + 2000);
      await voucherBox.connect(stranger).createCampaign("Camp 3", 0, 30, 15, latestTime + 3000);

      const all = await voucherBox.getAllCampaigns();
      expect(all.length).to.equal(3);

      const merchantCampaigns = await voucherBox.getOwnerCampaigns(merchant.address);
      expect(merchantCampaigns.length).to.equal(2);
      expect(merchantCampaigns[0].name).to.equal("Camp 1");
      expect(merchantCampaigns[1].name).to.equal("Camp 2");
    });
  });
});

