import { findUserByEmail } from '../repositories/userRepository.js';

export const login = async ({ email, password }) => {
    const user = await findUserByEmail(email);

    if (!user || user.password !== password) {
        return null;
    }

    return {
        token: `demo-token-${user.id}`,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
};
