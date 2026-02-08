import { ethers } from 'ethers';

export class TransactionController {
    constructor(keyring, provider) {
        this.keyring = keyring;
        this.provider = provider; // Now we inject provider directly
    }

    setProvider(provider) {
        this.provider = provider;
    }

    async getBalance() {
        if (!this.keyring.getAddress()) return '0';
        if (!this.provider) return '0';
        try {
            const balance = await this.provider.getBalance(this.keyring.getAddress());
            return ethers.formatEther(balance);
        } catch (e) {
            console.error('Failed to get balance:', e);
            return '0';
        }
    }

    // Basic transaction construction
    async sendTransaction(to, amount) {
        if (!this.keyring.wallet) throw new Error('Wallet not initialized');
        if (!this.provider) throw new Error('Provider not set');

        // Connect wallet to provider
        const connectedWallet = new ethers.Wallet(this.keyring.wallet.privateKey, this.provider);

        // Simple gas estimation could be added here
        const tx = {
            to: to,
            value: ethers.parseEther(amount)
        };

        const response = await connectedWallet.sendTransaction(tx);
        return response;
    }
}
