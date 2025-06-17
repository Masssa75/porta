// Token configuration for lifetime premium access
export const TOKEN_CONFIG = {
  // Base network configuration
  NETWORK: {
    chainId: 8453, // Base mainnet
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org'
  },
  
  // Token contract details
  TOKEN_CONTRACT: '0x4d1088F67AF81aDc9f0EAeb1CB2fD2b7d89aa20D',
  
  // Payment destination
  PAYMENT_WALLET: '0x64e7226Ccfac543f0093f1F532Fd231197818194',
  
  // Premium access requirements
  LIFETIME_PREMIUM_AMOUNT: '1000000', // 1M tokens (adjust decimals as needed)
  
  // Token ABI for reading balance and transfers
  TOKEN_ABI: [
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{"name": "", "type": "uint8"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [{"name": "", "type": "string"}],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "transfer",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    }
  ]
};

// Wallet connection configuration
export const WALLET_CONFIG = {
  SUPPORTED_WALLETS: ['MetaMask', 'WalletConnect', 'Coinbase Wallet'],
  REQUIRED_NETWORK: 8453, // Base mainnet
  SWITCH_NETWORK_CONFIG: {
    chainId: '0x2105', // 8453 in hex
    chainName: 'Base',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
  }
};