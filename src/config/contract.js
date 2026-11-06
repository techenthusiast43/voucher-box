import contractConfig from '../contracts/contractConfig.json';
import VoucherBoxABI from '../contracts/VoucherBoxABI.json';

// Priority:
// 1. Environment variable VITE_CONTRACT_ADDRESS
// 2. Local storage override (user can enter in UI)
// 3. Deployed contract address from contractConfig.json
export const getActiveContractAddress = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('voucherbox_custom_contract');
    if (custom && custom.startsWith('0x') && custom.length === 42) {
      return custom;
    }
  }
  return import.meta.env.VITE_CONTRACT_ADDRESS || contractConfig.address || '';
};

export const setCustomContractAddress = (address) => {
  if (typeof window !== 'undefined') {
    if (!address) {
      localStorage.removeItem('voucherbox_custom_contract');
    } else {
      localStorage.setItem('voucherbox_custom_contract', address);
    }
  }
};

export const CONTRACT_ABI = VoucherBoxABI;

