import { login } from '../services/authService.js';

export const loginController = async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contrasena son obligatorios.' });
    }

    const result = await login({ email, password });
    if (!result) {
        return res.status(401).json({ message: 'Credenciales invalidas.' });
    }

    return res.json(result);
};
