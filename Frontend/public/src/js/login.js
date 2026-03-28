// ============================================================
// KLARITY — login.js
// ============================================================
const API_BASE_URL =
    window.WISEPOCKET_API_BASE_URL ||
    'https://proyectoingweb2-production.up.railway.app/api';
const GOOGLE_CLIENT_ID = window.KLARITY_GOOGLE_CLIENT_ID || '';

const TOKEN_KEY = 'klarity_token';
const USER_KEY  = 'klarity_user';

// ── Helpers ───────────────────────────────────────────────
function redirectByRole(role) {
    const r = (role || '').toLowerCase();
    if (r === 'advisor') { window.location.href = '/advisor'; return; }
    if (r === 'admin')   { window.location.href = '/admin';   return; }
    window.location.href = '/dashboard';
}

function saveSession(data, remember) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, data.accessToken);
    store.setItem(USER_KEY,  JSON.stringify(data.user || {}));
}

function getJsonError(data, fallback) {
    if (!data) return fallback;
    if (Array.isArray(data.message)) return data.message.join(' ');
    if (typeof data.message === 'string') return data.message;
    return fallback;
}

function setMsg(outputEl, html, isError) {
    if (!outputEl) return;
    outputEl.classList.toggle('error', Boolean(isError));
    outputEl.innerHTML = html;
}

async function postJson(path, payload) {
    const response = await fetch(API_BASE_URL + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(getJsonError(data, 'No se pudo completar la operacion.'));
    }
    return data;
}

function validatePasswordStrength(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,128}$/.test(String(password || ''));
}

function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Already logged in? ────────────────────────────────────
(function() {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (token) {
        try {
            const user = JSON.parse(localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY) || '{}');
            redirectByRole(user.role);
        } catch { window.location.href = '/dashboard'; }
    }
})();

// ── Login form ────────────────────────────────────────────
const form    = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');

if (form) {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        setMsg(message, '<span style="color:var(--k-muted)">Validando credenciales...</span>');
        if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

        const payload = {
            email:    String(document.getElementById('email').value || '').trim(),
            password: String(document.getElementById('password').value || '')
        };

        try {
            const data = await postJson('/auth/login', payload);
            setMsg(message, '<span style="color:var(--k-success,#10b981)"><i class="bi bi-check-circle me-1"></i>Bienvenido/a. Redirigiendo...</span>');
            saveSession(data, true);
            setTimeout(() => redirectByRole(data.user && data.user.role), 600);
        } catch (error) {
            setMsg(message, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-exclamation-circle me-1"></i>' + escHtml(error.message || 'No se pudo conectar con el servidor.') + '</span>', true);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
        }
    });
}

// ── Register form ─────────────────────────────────────────
const registerForm    = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const btn = registerForm.querySelector('button[type="submit"]');
        setMsg(registerMessage, '<span style="color:var(--k-muted)">Creando cuenta...</span>');
        if (btn) { btn.disabled = true; btn.textContent = 'Creando...'; }

        const payload = {
            name:     String(document.getElementById('registerName').value || '').trim(),
            email:    String(document.getElementById('registerEmail').value || '').trim(),
            password: String(document.getElementById('registerPassword').value || '')
        };

        if (!validatePasswordStrength(payload.password)) {
            setMsg(registerMessage, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-shield-exclamation me-1"></i>La contrasena debe tener 10+ caracteres, mayuscula, minuscula, numero y simbolo.</span>', true);
            if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta'; }
            return;
        }

        try {
            const data = await postJson('/auth/register', payload);
            setMsg(registerMessage, '<span style="color:var(--k-success,#10b981)"><i class="bi bi-check-circle me-1"></i>Cuenta creada. Redirigiendo...</span>');
            saveSession(data, true);
            setTimeout(() => redirectByRole(data.user && data.user.role), 600);
        } catch (error) {
            setMsg(registerMessage, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-exclamation-circle me-1"></i>' + escHtml(error.message || 'No se pudo crear la cuenta.') + '</span>', true);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta'; }
        }
    });
}

const resetPanel = document.getElementById('passwordRecoveryPanel');
const verificationPanel = document.getElementById('verificationPanel');
const forgotPwdBtn = document.getElementById('forgotPwdBtn');
const resendVerifyBtn = document.getElementById('resendVerifyBtn');
const requestResetForm = document.getElementById('requestResetForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const resendVerificationForm = document.getElementById('resendVerificationForm');
const resetMessage = document.getElementById('resetMessage');
const verifyMessage = document.getElementById('verifyMessage');

if (forgotPwdBtn && resetPanel) {
    forgotPwdBtn.addEventListener('click', function () {
        resetPanel.style.display = resetPanel.style.display === 'none' ? 'block' : 'none';
    });
}

if (resendVerifyBtn && verificationPanel) {
    resendVerifyBtn.addEventListener('click', function () {
        verificationPanel.style.display = verificationPanel.style.display === 'none' ? 'block' : 'none';
    });
}

if (requestResetForm) {
    requestResetForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = String(document.getElementById('resetEmail').value || '').trim();
        try {
            const data = await postJson('/auth/request-password-reset', { email });
            setMsg(resetMessage, '<span style="color:var(--k-success,#10b981)"><i class="bi bi-envelope-check me-1"></i>' + escHtml(data.message || 'Solicitud enviada.') + '</span>');
        } catch (error) {
            setMsg(resetMessage, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-exclamation-circle me-1"></i>' + escHtml(error.message || 'No se pudo solicitar recuperacion.') + '</span>', true);
        }
    });
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const token = String(document.getElementById('resetToken').value || '').trim();
        const password = String(document.getElementById('newPassword').value || '');
        if (!validatePasswordStrength(password)) {
            setMsg(resetMessage, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-shield-exclamation me-1"></i>La nueva contrasena no cumple requisitos de seguridad.</span>', true);
            return;
        }
        try {
            const data = await postJson('/auth/reset-password', { token, password });
            setMsg(resetMessage, '<span style="color:var(--k-success,#10b981)"><i class="bi bi-check-circle me-1"></i>' + escHtml(data.message || 'Contrasena actualizada.') + '</span>');
        } catch (error) {
            setMsg(resetMessage, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-exclamation-circle me-1"></i>' + escHtml(error.message || 'No se pudo actualizar la contrasena.') + '</span>', true);
        }
    });
}

if (resendVerificationForm) {
    resendVerificationForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = String(document.getElementById('verifyEmail').value || '').trim();
        try {
            const data = await postJson('/auth/resend-verification', { email });
            setMsg(verifyMessage, '<span style="color:var(--k-success,#10b981)"><i class="bi bi-envelope-check me-1"></i>' + escHtml(data.message || 'Solicitud enviada.') + '</span>');
        } catch (error) {
            setMsg(verifyMessage, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-exclamation-circle me-1"></i>' + escHtml(error.message || 'No se pudo reenviar la verificacion.') + '</span>', true);
        }
    });
}

async function verifyTokenFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verifyToken');
    const resetToken = params.get('resetToken');

    if (verifyToken) {
        try {
            const data = await postJson('/auth/verify-email', { token: verifyToken });
            setMsg(message || registerMessage, '<span style="color:var(--k-success,#10b981)"><i class="bi bi-check-circle me-1"></i>' + escHtml(data.message || 'Correo verificado.') + '</span>');
        } catch (error) {
            setMsg(message || registerMessage, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-exclamation-circle me-1"></i>' + escHtml(error.message || 'No se pudo verificar el correo.') + '</span>', true);
        }
    }

    if (resetToken) {
        if (resetPanel) resetPanel.style.display = 'block';
        const resetTokenInput = document.getElementById('resetToken');
        if (resetTokenInput) resetTokenInput.value = resetToken;
    }
}

async function loginWithGoogleCredential(idToken) {
    const data = await postJson('/auth/google', { idToken });
    saveSession(data, true);
    redirectByRole(data.user && data.user.role);
}

function setupGoogleButtons() {
    if (!window.google || !window.google.accounts || !GOOGLE_CLIENT_ID) {
        return;
    }

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async function (response) {
            try {
                await loginWithGoogleCredential(response.credential);
            } catch (error) {
                const target = message || registerMessage;
                setMsg(target, '<span style="color:var(--k-danger,#ef4444)"><i class="bi bi-exclamation-circle me-1"></i>' + escHtml(error.message || 'No se pudo iniciar con Google.') + '</span>', true);
            }
        }
    });

    const loginGoogleBtn = document.getElementById('googleLoginBtn');
    const registerGoogleBtn = document.getElementById('googleRegisterBtn');

    function promptGoogle() {
        window.google.accounts.id.prompt();
    }

    if (loginGoogleBtn) {
        loginGoogleBtn.addEventListener('click', promptGoogle);
    }
    if (registerGoogleBtn) {
        registerGoogleBtn.addEventListener('click', promptGoogle);
    }
}

verifyTokenFromQuery();
setupGoogleButtons();
