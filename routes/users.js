const express = require('express');
const router = express.Router();
const { Agent } = require('../model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const cryptPassword = (password) => {
    // create a hash of the password using SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(password);
    // return the hash in hexadecimal format
    return hash.digest('hex');

}
router.get('/', async (req, res) => {
    try {
        const result = await Agent.getAllAgents();

        if (!result.success) {
            return res.status(result.code || 500).json(result);
        }

        return res.status(200).json({
            success: true,
            message: 'Agents récupérés avec succès',
            data: result.data,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des agents :', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur interne du serveur',
            error: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Agent.getAgentById(id);

        if (!result.success) {
            return res.status(result.code || 500).json(result);
        }

        return res.status(200).json({
            success: true,
            message: 'Agent récupéré avec succès',
            data: result.data,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'agent :', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur interne du serveur',
            error: error.message
        });
    }
});

router.post('/auth', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        const hashedPassword = cryptPassword(password); // Hash the password before sending it to the database

        if (!login || !password) {
            return res.status(400).json({
                success: false,
                message: 'Login et mot de passe requis',
            });
        }

        const result = await Agent.verifyCredentials(login, hashedPassword);

        if (!result.success) {
            return res.status(result.code || 500).json(result);
        }

        // Generate a token or session here if needed
        // For example, using JWT:
        const token = jwt.sign({ id: result.data.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ success: true, token });

    } catch (error) {
        console.error('Erreur lors de l\'authentification de l\'agent :', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur interne du serveur',
            error: error.message
        });
    }
});

module.exports = router;