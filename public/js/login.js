//Manejo del formulario de inicio de sesión
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginFormElement = loginForm.querySelector('.auth-form');
    const togglePasswordBtns = loginForm.querySelectorAll('.toggle-password');

    // Cambiar entre login y registro
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        switchToRegister();
    });

    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        switchToLogin();
    });

    // Función para cambiar a registro
    function switchToRegister() {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        clearLoginForm();
        // Limpiar también el formulario de registro si existe la función
        if (typeof window.clearRegisterForm === 'function') {
            window.clearRegisterForm();
        }
    }

    // Función para cambiar a login
    function switchToLogin() {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
        clearLoginForm();
        // Limpiar también el formulario de registro si existe la función
        if (typeof window.clearRegisterForm === 'function') {
            window.clearRegisterForm();
        }
    }

    // Limpiar formulario de login
    function clearLoginForm() {
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
            input.type = input.getAttribute('type') === 'text' ? 'password' : input.type; // Resetear tipo de input de contraseña
            input.parentElement.classList.remove('error', 'success');
        });
        
        // Resetear botones de toggle password
        const toggleBtns = loginForm.querySelectorAll('.toggle-password');
        toggleBtns.forEach(btn => {
            btn.textContent = '👁️';
        });
        
        // Remover todos los mensajes de error
        const errorMessages = loginForm.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
    }

    // Toggle para mostrar/ocultar contraseña
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            
            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                this.textContent = '🙈';
            } else {
                targetInput.type = 'password';
                this.textContent = '👁️';
            }
        });
    });

    // Validación en tiempo real
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    emailInput.addEventListener('blur', function() {
        validateEmail(this);
    });

    emailInput.addEventListener('input', function() {
        if (this.parentElement.classList.contains('error')) {
            validateEmail(this);
        }
    });

    passwordInput.addEventListener('blur', function() {
        validatePassword(this);
    });

    passwordInput.addEventListener('input', function() {
        if (this.parentElement.classList.contains('error')) {
            validatePassword(this);
        }
    });

    // Validar email
    function validateEmail(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const inputGroup = input.parentElement;
        
        if (!input.value.trim()) {
            setInputError(inputGroup, 'El correo electrónico es requerido');
            return false;
        } else if (!emailRegex.test(input.value)) {
            setInputError(inputGroup, 'Ingresa un correo electrónico válido');
            return false;
        } else {
            setInputSuccess(inputGroup);
            return true;
        }
    }

    // Validar contraseña
    function validatePassword(input) {
        const inputGroup = input.parentElement;
        
        if (!input.value.trim()) {
            setInputError(inputGroup, 'La contraseña es requerida');
            return false;
        } else if (input.value.length < 6) {
            setInputError(inputGroup, 'La contraseña debe tener al menos 6 caracteres');
            return false;
        } else {
            setInputSuccess(inputGroup);
            return true;
        }
    }

    // Establecer error en input
    function setInputError(inputGroup, message) {
        inputGroup.classList.remove('success');
        inputGroup.classList.add('error');
        
        // Remover mensaje de error previo
        const existingError = inputGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Agregar nuevo mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            color: #ef4444;
            font-size: 0.85rem;
            margin-top: 5px;
            font-weight: 500;
            position: absolute;
            bottom: -20px;
            left: 0;
            width: 100%;
        `;
        errorDiv.textContent = message;
        inputGroup.appendChild(errorDiv);
    }

    // Establecer éxito en input
    function setInputSuccess(inputGroup) {
        inputGroup.classList.remove('error');
        inputGroup.classList.add('success');
        
        // Remover mensaje de error
        const errorMessage = inputGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    // Manejo del envío del formulario
    loginFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isEmailValid = validateEmail(emailInput);
        const isPasswordValid = validatePassword(passwordInput);
        
        if (isEmailValid && isPasswordValid) {
            await handleLogin();
        } else {
            // Agregar animación de shake al formulario
            loginForm.classList.add('shake');
            setTimeout(() => {
                loginForm.classList.remove('shake');
            }, 500);
        }
    });

    // Función para manejar el login
    async function handleLogin() {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Mostrar loading en el botón
        const submitBtn = loginForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Iniciando sesión...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            // Mostrar mensaje de éxito
            showSuccessMessage('¡Inicio de sesión exitoso!');
            sessionStorage.setItem('loggedInEmail', email);

            // Deshabilitar formulario de login y ocultar formulario de registro
            loginForm.classList.add('disabled');
            if (registerForm) {
                registerForm.style.display = 'none';
            }

            setTimeout(() => {
                document.body.classList.add('fade-out');
                setTimeout(() => {
                    window.location.href = data.redirect || '/Facturacion';
                }, 500);
            }, 2000);
        } catch (error) {
            if (error.message.includes('Correo no existente')) {
                setInputError(emailInput.parentElement, 'Correo no existente');
            } else if (error.message.includes('Contraseña errada')) {
                setInputError(passwordInput.parentElement, 'Contraseña errada');
            } else {
                showErrorMessage(error.message);
            }
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Mostrar mensaje de éxito
    function showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
            z-index: 1000;
            font-weight: 600;
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        if (!document.querySelector('#login-animations')) {
            const style = document.createElement('style');
            style.id = 'login-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                body.fade-out {
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                }
                .disabled {
                    opacity: 0.6;
                    pointer-events: none;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }

    // Función para mostrar mensaje de error
    function showErrorMessage(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
            z-index: 1000;
            font-weight: 600;
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }

    // Función pública para cambiar a login (puede ser llamada desde register.js)
    window.switchToLogin = switchToLogin;
});