document.addEventListener('DOMContentLoaded', async () => {
    const animationOverlay = document.getElementById('animation-overlay');
    const mainContent = document.querySelector('.main-content');
    const email = sessionStorage.getItem('registeredEmail');

    console.log('Email from sessionStorage:', email); // Depuración

    if (!email) {
        console.log('No email in sessionStorage, showing main content');
        mainContent.classList.add('active');
        return;
    }

    try {
        const response = await fetch('/data/animation.json');
        if (!response.ok) {
            console.error('Fetch error:', response.status, response.statusText);
            throw new Error('No se pudo cargar animation.json');
        }
        const animationData = await response.json();

        if (animationData.registeredEmails && Array.isArray(animationData.registeredEmails) && animationData.registeredEmails.includes(email)) {
            // Mostrar la animación por etapas
            startStageAnimation();
        } else {
            console.log('Email not found or invalid data, showing main content');
            mainContent.classList.add('active');
            sessionStorage.removeItem('registeredEmail');
        }
    } catch (error) {
        console.error('Error checking animation data:', error);
        mainContent.classList.add('active');
        sessionStorage.removeItem('registeredEmail');
    }
});

function startStageAnimation() {
    const animationOverlay = document.getElementById('animation-overlay');
    const stages = ['stage-1', 'stage-2', 'stage-3'];
    let currentStage = 0;

    // Mostrar el overlay de animación
    animationOverlay.style.display = 'flex';

    // Función para mostrar la siguiente etapa
    function showNextStage() {
        // Ocultar etapa actual
        if (currentStage > 0) {
            const prevStage = document.getElementById(stages[currentStage - 1]);
            if (prevStage) {
                prevStage.classList.remove('active');
                prevStage.classList.add('exit');
            }
        }

        // Mostrar nueva etapa
        if (currentStage < stages.length) {
            const nextStage = document.getElementById(stages[currentStage]);
            if (nextStage) {
                nextStage.classList.remove('exit');
                nextStage.classList.add('active');
            }
            
            console.log(`Mostrando etapa ${currentStage + 1}`);
            currentStage++;

            // Programar siguiente etapa
            if (currentStage < stages.length) {
                setTimeout(showNextStage, 4000); // 4 segundos por etapa
            } else {
                // Última etapa, finalizar animación
                setTimeout(finishAnimation, 5000); // 5 segundos para la última etapa
            }
        } else {
            finishAnimation();
        }
    }

    // Función para finalizar la animación
    function finishAnimation() {
        const animationOverlay = document.getElementById('animation-overlay');
        const mainContent = document.querySelector('.main-content');

        console.log('Finalizando animación...');
        
        animationOverlay.classList.add('hide');
        setTimeout(() => {
            animationOverlay.style.display = 'none';
            mainContent.classList.add('active');
            sessionStorage.removeItem('registeredEmail');
        }, 1000); // Esperar a que la transición de opacidad termine
    }

    // Iniciar la primera etapa después de un pequeño retraso
    setTimeout(showNextStage, 500);
}

// Funciones adicionales para control manual (opcional)
function skipAnimation() {
    const animationOverlay = document.getElementById('animation-overlay');
    const mainContent = document.querySelector('.main-content');
    
    animationOverlay.classList.add('hide');
    setTimeout(() => {
        animationOverlay.style.display = 'none';
        mainContent.classList.add('active');
        sessionStorage.removeItem('registeredEmail');
    }, 500);
}

// Agregar control con tecla ESC para saltar animación
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const animationOverlay = document.getElementById('animation-overlay');
        if (animationOverlay.style.display === 'flex') {
            skipAnimation();
        }
    }
});