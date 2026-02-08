import { ethers } from 'ethers';

// Basic ERC-20 ABI for balance check
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

const DEFAULT_TOKENS = {
    'bsc': [],
    'eth': [],
    'arb': [],
    'pol': []
};

export class TokenController {
    constructor() {
        this.tokens = { ...DEFAULT_TOKENS };
    }

    async load() {
        const data = await chrome.storage.local.get('tokens');
        if (data.tokens) {
            this.tokens = JSON.parse(data.tokens);
        }
        // Ensure structure is correct (fill missing keys if needed)
        for (const key of Object.keys(DEFAULT_TOKENS)) {
            if (!this.tokens[key]) this.tokens[key] = [];
        }
    }

    async save() {
        await chrome.storage.local.set({ 'tokens': JSON.stringify(this.tokens) });
    }

    async addToken(networkKey, address, provider) {
        if (!this.tokens[networkKey]) this.tokens[networkKey] = [];

        // Validate and fetch metadata
        try {
            const contract = new ethers.Contract(address, ERC20_ABI, provider);
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();

            // Check if exists
            const exists = this.tokens[networkKey].find(t => t.address.toLowerCase() === address.toLowerCase());
            if (exists) throw new Error('Token already added');

            this.tokens[networkKey].push({
                address,
                symbol,
                decimals: Number(decimals)
            });
            await this.save();
            return symbol;
        } catch (e) {
            throw new Error('Failed to add token: ' + e.message);
        }
    }

    getTokens(networkKey) {
        return this.tokens[networkKey] || [];
    }

    async getTokenBalances(networkKey, walletAddress, provider) {
        const tokens = this.getTokens(networkKey);
        const balances = {};

        // Parallel fetch
        await Promise.all(tokens.map(async (token) => {
            try {
                const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
                const bal = await contract.balanceOf(walletAddress);
                balances[token.address] = ethers.formatUnits(bal, token.decimals);
            } catch (e) {
                console.error(`Failed to fetch balance for ${token.symbol}`, e);
                balances[token.address] = '0';
            }
        }));

        return balances;
    }
}
