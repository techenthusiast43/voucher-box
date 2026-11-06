import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { getActiveContractAddress, CONTRACT_ABI } from '../config/contract';
import { useMemo } from 'react';

export function useVoucherBox() {
  const { address: userAddress, chainId } = useAccount();
  const contractAddress = getActiveContractAddress();

  // 1. Read All Campaigns
  const {
    data: rawCampaigns,
    isLoading: isLoadingCampaigns,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useReadContract({
    address: contractAddress || undefined,
    abi: CONTRACT_ABI,
    functionName: 'getAllCampaigns',
    query: {
      enabled: Boolean(contractAddress),
      refetchInterval: 8000,
    },
  });

  // 2. Read User Vouchers
  const {
    data: rawUserVouchers,
    isLoading: isLoadingUserVouchers,
    error: userVouchersError,
    refetch: refetchUserVouchers,
  } = useReadContract({
    address: contractAddress || undefined,
    abi: CONTRACT_ABI,
    functionName: 'getUserVouchers',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(contractAddress && userAddress),
      refetchInterval: 8000,
    },
  });

  // 3. Read Merchant Campaigns
  const {
    data: rawMerchantCampaigns,
    isLoading: isLoadingMerchantCampaigns,
    error: merchantCampaignsError,
    refetch: refetchMerchantCampaigns,
  } = useReadContract({
    address: contractAddress || undefined,
    abi: CONTRACT_ABI,
    functionName: 'getOwnerCampaigns',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(contractAddress && userAddress),
      refetchInterval: 8000,
    },
  });

  // Format campaigns into clean objects
  const campaigns = useMemo(() => {
    if (!rawCampaigns || !Array.isArray(rawCampaigns)) return [];
    return rawCampaigns.map((c) => ({
      id: Number(c.id),
      owner: c.owner,
      name: c.name,
      discountType: Number(c.discountType), // 0: Percentage, 1: Fixed
      discountValue: Number(c.discountValue),
      maxClaims: Number(c.maxClaims),
      claimedCount: Number(c.claimedCount),
      redeemedCount: Number(c.redeemedCount),
      expiryDate: Number(c.expiryDate),
      isCancelled: Boolean(c.isCancelled),
    }));
  }, [rawCampaigns]);

  // Format user vouchers
  const userVouchers = useMemo(() => {
    if (!rawUserVouchers || !Array.isArray(rawUserVouchers)) return [];
    return rawUserVouchers.map((v) => ({
      voucherId: Number(v.voucherId),
      campaignId: Number(v.campaignId),
      customer: v.customer,
      claimedAt: Number(v.claimedAt),
      redeemedAt: Number(v.redeemedAt),
      isRedeemed: Boolean(v.isRedeemed),
    }));
  }, [rawUserVouchers]);

  // Format merchant campaigns
  const merchantCampaigns = useMemo(() => {
    if (!rawMerchantCampaigns || !Array.isArray(rawMerchantCampaigns)) return [];
    return rawMerchantCampaigns.map((c) => ({
      id: Number(c.id),
      owner: c.owner,
      name: c.name,
      discountType: Number(c.discountType),
      discountValue: Number(c.discountValue),
      maxClaims: Number(c.maxClaims),
      claimedCount: Number(c.claimedCount),
      redeemedCount: Number(c.redeemedCount),
      expiryDate: Number(c.expiryDate),
      isCancelled: Boolean(c.isCancelled),
    }));
  }, [rawMerchantCampaigns]);

  // Contract Write Actions
  const {
    writeContractAsync,
    data: txHash,
    isPending: isTxPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isTxConfirming,
    isSuccess: isTxSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Action: Create Campaign
  const createCampaign = async (name, discountType, discountValue, maxClaims, expiryTimestamp) => {
    if (!contractAddress) throw new Error("Contract address not configured");
    return await writeContractAsync({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'createCampaign',
      args: [
        name,
        Number(discountType),
        BigInt(discountValue),
        BigInt(maxClaims),
        BigInt(expiryTimestamp),
      ],
    });
  };

  // Action: Claim Voucher
  const claimVoucher = async (campaignId) => {
    if (!contractAddress) throw new Error("Contract address not configured");
    return await writeContractAsync({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'claimVoucher',
      args: [BigInt(campaignId)],
    });
  };

  // Action: Redeem Voucher
  const redeemVoucher = async (voucherId) => {
    if (!contractAddress) throw new Error("Contract address not configured");
    return await writeContractAsync({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'redeemVoucher',
      args: [BigInt(voucherId)],
    });
  };

  // Action: Cancel Campaign
  const cancelCampaign = async (campaignId) => {
    if (!contractAddress) throw new Error("Contract address not configured");
    return await writeContractAsync({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'cancelCampaign',
      args: [BigInt(campaignId)],
    });
  };

  const refetchAll = () => {
    refetchCampaigns?.();
    refetchUserVouchers?.();
    refetchMerchantCampaigns?.();
  };

  return {
    contractAddress,
    chainId,
    campaigns,
    userVouchers,
    merchantCampaigns,
    isLoadingCampaigns,
    isLoadingUserVouchers,
    isLoadingMerchantCampaigns,
    campaignsError,
    userVouchersError,
    merchantCampaignsError,
    // Mutations
    createCampaign,
    claimVoucher,
    redeemVoucher,
    cancelCampaign,
    refetchAll,
    // TX states
    txHash,
    isTxPending,
    isTxConfirming,
    isTxSuccess,
    writeError,
    confirmError,
    resetWrite,
  };
}

