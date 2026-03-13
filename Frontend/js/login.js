const API_BASE_URL = 'http://localhost:3000/api';

const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Validando credenciales...';

    const formData = new FormData(form);
    const payload = {
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || '')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            message.textContent = data.message || 'No se pudo iniciar sesion.';
            return;
        }

        message.textContent = `Bienvenido, ${data.user.name}. Login correcto.`;
        form.reset();
    } catch (error) {
        message.textContent = 'No se pudo conectar con el backend. Ejecuta la API en localhost:3000.';
    }
});
