// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VoucherBox
 * @notice Digital Discount Voucher Campaign Platform for BOT Chain
 */
contract VoucherBox {
    enum DiscountType { Percentage, Fixed }

    struct Campaign {
        uint256 id;
        address owner;
        string name;
        DiscountType discountType;
        uint256 discountValue; // e.g. 15 for 15% or fixed amount in currency units
        uint256 maxClaims;
        uint256 claimedCount;
        uint256 redeemedCount;
        uint256 expiryDate; // UNIX timestamp
        bool isCancelled;
    }

    struct Voucher {
        uint256 voucherId;
        uint256 campaignId;
        address customer;
        uint256 claimedAt;
        uint256 redeemedAt;
        bool isRedeemed;
    }

    uint256 public nextCampaignId = 1;
    uint256 public nextVoucherId = 1;

    // campaignId => Campaign
    mapping(uint256 => Campaign) public campaigns;

    // voucherId => Voucher
    mapping(uint256 => Voucher) public vouchers;

    // campaignId => customer address => hasClaimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // customer address => array of voucherIds
    mapping(address => uint256[]) private userVoucherIds;

    // owner address => array of campaignIds
    mapping(address => uint256[]) private ownerCampaignIds;

    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed owner,
        string name,
        DiscountType discountType,
        uint256 discountValue,
        uint256 maxClaims,
        uint256 expiryDate
    );

    event VoucherClaimed(
        uint256 indexed voucherId,
        uint256 indexed campaignId,
        address indexed customer,
        uint256 timestamp
    );

    event VoucherRedeemed(
        uint256 indexed voucherId,
        uint256 indexed campaignId,
        address indexed customer,
        address business,
        uint256 timestamp
    );

    event CampaignCancelled(
        uint256 indexed campaignId,
        address indexed owner,
        uint256 timestamp
    );

    // Custom errors for gas efficiency
    error InvalidName();
    error InvalidMaxClaims();
    error InvalidExpiryDate();
    error InvalidPercentage();
    error CampaignDoesNotExist();
    error CampaignIsCancelled();
    error CampaignIsExpired();
    error MaxClaimsReached();
    error AlreadyClaimed();
    error VoucherDoesNotExist();
    error VoucherAlreadyRedeemed();
    error NotCampaignOwner();

    // Modifiers
    modifier onlyCampaignOwner(uint256 _campaignId) {
        if (campaigns[_campaignId].owner != msg.sender) {
            revert NotCampaignOwner();
        }
        _;
    }

    /**
     * @notice Create a new voucher campaign
     * @param _name Campaign display name
     * @param _discountType 0 for Percentage, 1 for Fixed
     * @param _discountValue Value of discount (e.g. 25 for 25%)
     * @param _maxClaims Maximum vouchers that can be claimed
     * @param _expiryDate Expiration timestamp in seconds
     */
    function createCampaign(
        string calldata _name,
        DiscountType _discountType,
        uint256 _discountValue,
        uint256 _maxClaims,
        uint256 _expiryDate
    ) external returns (uint256) {
        if (bytes(_name).length == 0) revert InvalidName();
        if (_maxClaims == 0) revert InvalidMaxClaims();
        if (_expiryDate <= block.timestamp) revert InvalidExpiryDate();
        if (_discountType == DiscountType.Percentage && _discountValue > 100) revert InvalidPercentage();

        uint256 campaignId = nextCampaignId++;

        campaigns[campaignId] = Campaign({
            id: campaignId,
            owner: msg.sender,
            name: _name,
            discountType: _discountType,
            discountValue: _discountValue,
            maxClaims: _maxClaims,
            claimedCount: 0,
            redeemedCount: 0,
            expiryDate: _expiryDate,
            isCancelled: false
        });

        ownerCampaignIds[msg.sender].push(campaignId);

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _name,
            _discountType,
            _discountValue,
            _maxClaims,
            _expiryDate
        );

        return campaignId;
    }

    /**
     * @notice Customer claims a voucher for a campaign
     * @param _campaignId Target campaign ID
     */
    function claimVoucher(uint256 _campaignId) external returns (uint256) {
        Campaign storage camp = campaigns[_campaignId];
        if (camp.id == 0) revert CampaignDoesNotExist();
        if (camp.isCancelled) revert CampaignIsCancelled();
        if (block.timestamp > camp.expiryDate) revert CampaignIsExpired();
        if (camp.claimedCount >= camp.maxClaims) revert MaxClaimsReached();
        if (hasClaimed[_campaignId][msg.sender]) revert AlreadyClaimed();

        hasClaimed[_campaignId][msg.sender] = true;
        camp.claimedCount++;

        uint256 voucherId = nextVoucherId++;
        vouchers[voucherId] = Voucher({
            voucherId: voucherId,
            campaignId: _campaignId,
            customer: msg.sender,
            claimedAt: block.timestamp,
            redeemedAt: 0,
            isRedeemed: false
        });

        userVoucherIds[msg.sender].push(voucherId);

        emit VoucherClaimed(voucherId, _campaignId, msg.sender, block.timestamp);

        return voucherId;
    }

    /**
     * @notice Business redeems a customer voucher
     * @param _voucherId Target voucher ID
     */
    function redeemVoucher(uint256 _voucherId) external {
        Voucher storage v = vouchers[_voucherId];
        if (v.voucherId == 0) revert VoucherDoesNotExist();
        if (v.isRedeemed) revert VoucherAlreadyRedeemed();

        Campaign storage camp = campaigns[v.campaignId];
        if (camp.owner != msg.sender) revert NotCampaignOwner();
        if (camp.isCancelled) revert CampaignIsCancelled();
        if (block.timestamp > camp.expiryDate) revert CampaignIsExpired();

        v.isRedeemed = true;
        v.redeemedAt = block.timestamp;
        camp.redeemedCount++;

        emit VoucherRedeemed(_voucherId, v.campaignId, v.customer, msg.sender, block.timestamp);
    }

    /**
     * @notice Business cancels an active campaign
     * @param _campaignId Target campaign ID
     */
    function cancelCampaign(uint256 _campaignId) external onlyCampaignOwner(_campaignId) {
        Campaign storage camp = campaigns[_campaignId];
        if (camp.isCancelled) revert CampaignIsCancelled();

        camp.isCancelled = true;

        emit CampaignCancelled(_campaignId, msg.sender, block.timestamp);
    }

    /**
     * @notice Get campaign details by ID
     */
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        Campaign memory camp = campaigns[_campaignId];
        if (camp.id == 0) revert CampaignDoesNotExist();
        return camp;
    }

    /**
     * @notice Get all vouchers claimed by a user
     */
    function getUserVouchers(address _user) external view returns (Voucher[] memory) {
        uint256[] memory ids = userVoucherIds[_user];
        Voucher[] memory userList = new Voucher[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            userList[i] = vouchers[ids[i]];
        }
        return userList;
    }

    /**
     * @notice Get all campaigns created by a business owner
     */
    function getOwnerCampaigns(address _owner) external view returns (Campaign[] memory) {
        uint256[] memory ids = ownerCampaignIds[_owner];
        Campaign[] memory ownerList = new Campaign[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            ownerList[i] = campaigns[ids[i]];
        }
        return ownerList;
    }

    /**
     * @notice Get all campaigns for exploration
     */
    function getAllCampaigns() external view returns (Campaign[] memory) {
        uint256 total = nextCampaignId - 1;
        Campaign[] memory allList = new Campaign[](total);
        for (uint256 i = 1; i <= total; i++) {
            allList[i - 1] = campaigns[i];
        }
        return allList;
    }

    /**
     * @notice Get voucher details and its associated campaign
     */
    function getVoucher(uint256 _voucherId) external view returns (Voucher memory, Campaign memory) {
        Voucher memory v = vouchers[_voucherId];
        if (v.voucherId == 0) revert VoucherDoesNotExist();
        Campaign memory camp = campaigns[v.campaignId];
        return (v, camp);
    }

    /**
     * @notice Check whether a user has already claimed a campaign
     */
    function hasUserClaimed(uint256 _campaignId, address _user) external view returns (bool) {
        return hasClaimed[_campaignId][_user];
    }

    /**
     * @notice Total number of campaigns created
     */
    function getCampaignCount() external view returns (uint256) {
        return nextCampaignId - 1;
    }

    /**
     * @notice Total number of vouchers issued
     */
    function getVoucherCount() external view returns (uint256) {
        return nextVoucherId - 1;
    }
}

