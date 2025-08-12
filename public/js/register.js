//Manejo del formulario de registro
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const registerForm = document.getElementById('register-form');
    const registerFormElement = registerForm.querySelector('.auth-form');
    const togglePasswordBtns = registerForm.querySelectorAll('.toggle-password');
    const passwordMatchIndicator = document.getElementById('password-match-indicator');

    // Inputs del registro
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('register-confirm-password');

    // Toggle para mostrar/ocultar contraseñas
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
    nameInput.addEventListener('blur', function() {
        validateName(this);
    });

    nameInput.addEventListener('input', function() {
        if (this.parentElement.classList.contains('error')) {
            validateName(this);
        }
    });

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
        checkPasswordMatch();
    });

    confirmPasswordInput.addEventListener('blur', function() {
        validateConfirmPassword(this);
    });

    confirmPasswordInput.addEventListener('input', function() {
        if (this.parentElement.classList.contains('error')) {
            validateConfirmPassword(this);
        }
        checkPasswordMatch();
    });

    // Validar nombre completo
    function validateName(input) {
        const inputGroup = input.parentElement;
        const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
        
        if (!input.value.trim()) {
            setInputError(inputGroup, 'El nombre completo es requerido');
            return false;
        } else if (input.value.trim().length < 2) {
            setInputError(inputGroup, 'El nombre debe tener al menos 2 caracteres');
            return false;
        } else if (!nameRegex.test(input.value.trim())) {
            setInputError(inputGroup, 'El nombre solo puede contener letras y espacios');
            return false;
        } else {
            setInputSuccess(inputGroup);
            return true;
        }
    }

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
        const password = input.value;
        
        if (!password) {
            setInputError(inputGroup, 'La contraseña es requerida');
            return false;
        } else if (password.length < 8) {
            setInputError(inputGroup, 'La contraseña debe tener al menos 8 caracteres');
            return false;
        } else if (!/(?=.*[a-z])/.test(password)) {
            setInputError(inputGroup, 'La contraseña debe contener al menos una minúscula');
            return false;
        } else if (!/(?=.*[A-Z])/.test(password)) {
            setInputError(inputGroup, 'La contraseña debe contener al menos una mayúscula');
            return false;
        } else if (!/(?=.*\d)/.test(password)) {
            setInputError(inputGroup, 'La contraseña debe contener al menos un número');
            return false;
        } else {
            setInputSuccess(inputGroup);
            return true;
        }
    }

    // Validar confirmación de contraseña
    function validateConfirmPassword(input) {
        const inputGroup = input.parentElement;
        
        if (!input.value) {
            setInputError(inputGroup, 'Confirma tu contraseña');
            return false;
        } else if (input.value !== passwordInput.value) {
            setInputError(inputGroup, 'Las contraseñas no coinciden');
            return false;
        } else {
            setInputSuccess(inputGroup);
            return true;
        }
    }

    // Verificar coincidencia de contraseñas en tiempo real
    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (password && confirmPassword) {
            if (password === confirmPassword) {
                passwordMatchIndicator.textContent = '✅ Las contraseñas coinciden';
                passwordMatchIndicator.className = 'password-indicator match show';
            } else {
                passwordMatchIndicator.textContent = '❌ Las contraseñas no coinciden';
                passwordMatchIndicator.className = 'password-indicator no-match show';
            }
        } else {
            passwordMatchIndicator.className = 'password-indicator';
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

    // Limpiar formulario de registro
    function clearRegisterForm() {
        const inputs = registerForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
            input.parentElement.classList.remove('error', 'success');
        });
        passwordMatchIndicator.className = 'password-indicator';
        
        // Remover todos los mensajes de error
        const errorMessages = registerForm.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
    }

    // Manejo del envío del formulario
    registerFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isNameValid = validateName(nameInput);
        const isEmailValid = validateEmail(emailInput);
        const isPasswordValid = validatePassword(passwordInput);
        const isConfirmPasswordValid = validateConfirmPassword(confirmPasswordInput);
        
        if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
            await handleRegister();
        } else {
            registerForm.classList.add('shake');
            setTimeout(() => {
                registerForm.classList.remove('shake');
            }, 500);
        }
    });

    // Función para manejar el registro
    async function handleRegister() {
        const formData = {
            fullName: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };
        
        const submitBtn = registerForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creando cuenta...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al registrar');
            }

            showSuccessMessage(data.message);
            clearRegisterForm();
            sessionStorage.setItem('registeredEmail', formData.email);

            // Desactivar formulario de registro y ocultar formulario de inicio de sesión
            registerForm.classList.add('disabled');
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.style.display = 'none';
            }

            setTimeout(() => {
                // Añadir clase de desvanecimiento antes de redirigir
                document.body.classList.add('fade-out');
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 500); // Esperar a que la transición termine
            }, 2000);
        } catch (error) {
            showErrorMessage(error.message);
            if (error.message.includes('correo ya está registrado')) {
                setInputError(emailInput.parentElement, 'Este correo ya está en uso');
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
        
        if (!document.querySelector('#register-animations')) {
            const style = document.createElement('style');
            style.id = 'register-animations';
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
        }, 4000);
    }

    // Mostrar mensaje de error
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
        }, 4000);
    }

    // Función pública para limpiar el formulario
    window.clearRegisterForm = clearRegisterForm;
});