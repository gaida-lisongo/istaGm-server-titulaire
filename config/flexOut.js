require('dotenv').config();

class FlexPayOut {
    static instance = null;
    token = null;
    tokenExpiration = null;
    isInitialized = false;

    endpoints = {
        login: `${process.env.FLEX_OUT_URL}/auth/authenticate`,
        check: `${process.env.FLEX_OUT_URL}/merchant/check`,
        balance: `${process.env.FLEX_OUT_URL}/merchant/balance`,
        payment: `${process.env.FLEX_OUT_URL}/merchant/pay`,
    }

    user = {
        username: process.env.FLEX_OUT_USERNAME,
        password: process.env.FLEX_OUT_PASSWORD,
    }

    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    constructor() {
        if (FlexPayOut.instance) {
            return FlexPayOut.instance;
        }
        console.log('Initializing FlexPayOut...');
        FlexPayOut.instance = this;
        return this;
    }

    async initialize() {
        if (!this.isInitialized) {
            await this.initializeToken();
            this.isInitialized = true;
        }
        return this;
    }

    async initializeToken() {
        if (!this.isTokenValid()) {
            await this.getToken();
        }
    }

    async ensureValidToken() {
        if (!this.isTokenValid()) {
            const tokenResult = await this.getToken();
            if (!tokenResult.success) {
                throw new Error('Unable to obtain valid token');
            }
        }
        return true;
    }

    isTokenValid() {
        return this.token && this.tokenExpiration && Date.now() < this.tokenExpiration;
    }

    async getToken() {
        try {
            const response = await fetch(`${this.endpoints.login}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(this.user),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const { code, token } = data;
            
            if (token) {
                this.token = token;
                this.tokenExpiration = Date.now() + 3600 * 1000; // Token expiration set to 1 hour from now
                this.headers['Authorization'] = `Bearer ${this.token}`;
                return { success: true, token: this.token };
            } else {
                return { success: false, message: data.message };
            }
            
        } catch (error) {
            console.error('Error getting token:', error);
            return { success: false, message: 'Error getting token', error };
            
        }
    }

    async getBalance() {
        await this.ensureValidToken();
        try {
            const response = await fetch(`${this.endpoints.balance}/ELMES`, {
                method: 'GET',
                headers: this.headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error('Error checking balance:', error);
            return { success: false, message: 'Error checking balance', error };
            
        }
    }

    async checkTransaction(orderNumber) {
        await this.ensureValidToken();
        try {
            const response = await fetch(`${this.endpoints.check}/${orderNumber}`, {
                method: 'GET',
                headers: this.headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error('Error checking transaction:', error);
            return { success: false, message: 'Error checking transaction', error };
            
        }
    }

    async makePayment(data) {
        await this.ensureValidToken();
        try {
            const { reference, amount, monnaie, phone, description } = data;
            const payload = {
                merchant: 'ELMES',
                type: 1,
                reference: reference,
                amount: amount,
                currency: monnaie,
                custommer: phone,
                description: description,
                caalback_url: "https://admin.ista.net",
            }
            const response = await fetch(`${this.endpoints.payment}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
            
        } catch (error) {
            console.error('Error making payment:', error);
            return { success: false, message: 'Error making payment', error };
            
        }
    }
}

// Créer l'instance
const instance = new FlexPayOut();

// Exporter l'instance et la méthode d'initialisation
module.exports = instance;