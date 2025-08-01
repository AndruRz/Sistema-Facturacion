document.addEventListener('DOMContentLoaded', () => {
    // Funcionalidad mejorada: solo bloquear retroceso hacia /Facturacion
    (function() {
        // Verificar si venimos de /Facturacion
        const referrer = document.referrer || '';
        const cameFromFacturacion = referrer.includes('/Facturacion') || 
                                   window.location.search.includes('from=Facturacion');
        
        if (cameFromFacturacion) {
            console.log('Usuario viene de Facturación - bloqueando retroceso');
            
            // Marcar en sessionStorage que venimos de facturación
            sessionStorage.setItem('blockBackToFacturacion', 'true');
            
            // Reemplazar el estado actual sin agregar múltiples entradas
            history.replaceState({ 
                page: 'home', 
                preventBackToFacturacion: true,
                timestamp: Date.now()
            }, null, '/');
            
            // Agregar solo UNA entrada adicional al historial
            history.pushState({ 
                page: 'home', 
                preventBackToFacturacion: true,
                timestamp: Date.now()
            }, null, '/');
        }
        
        // Variable para controlar el procesamiento de popstate
        let isHandlingPopstate = false;
        
        // Escuchar eventos de navegación
        window.addEventListener('popstate', function(event) {
            // Evitar múltiples ejecuciones simultáneas
            if (isHandlingPopstate) return;
            
            // Solo intervenir si tenemos la marca de bloqueo
            const shouldBlock = sessionStorage.getItem('blockBackToFacturacion') === 'true';
            
            if (shouldBlock && event.state && event.state.preventBackToFacturacion) {
                isHandlingPopstate = true;
                
                // En lugar de forzar recarga, simplemente mantener en home
                history.pushState({ 
                    page: 'home', 
                    preventBackToFacturacion: true,
                    timestamp: Date.now()
                }, null, '/');
                
                // Mostrar mensaje opcional al usuario
                console.log('Retroceso hacia facturación bloqueado');
                
                // Liberar el bloqueo después de un momento
                setTimeout(() => {
                    isHandlingPopstate = false;
                }, 50);
            } else {
                // Si no hay bloqueo activo, permitir navegación normal
                isHandlingPopstate = false;
            }
        });
        
        // Limpiar el bloqueo cuando el usuario navegue a otra página (no home)
        window.addEventListener('beforeunload', function() {
            // Solo limpiar si estamos saliendo realmente de home
            if (!window.location.pathname.includes('/') || window.location.pathname !== '/') {
                sessionStorage.removeItem('blockBackToFacturacion');
            }
        });
        
        // Bloquear atajos de teclado solo cuando hay bloqueo activo
        window.addEventListener('keydown', function(event) {
            const shouldBlock = sessionStorage.getItem('blockBackToFacturacion') === 'true';
            
            if (shouldBlock) {
                // Bloquear Alt + Flecha Izquierda
                if (event.altKey && event.key === 'ArrowLeft') {
                    event.preventDefault();
                    console.log('Atajo de retroceso bloqueado');
                }
                
                // Bloquear Backspace fuera de campos de entrada
                if (event.key === 'Backspace' && 
                    !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) &&
                    !event.target.isContentEditable) {
                    event.preventDefault();
                    console.log('Backspace bloqueado');
                }
            }
        });
        
        // Función para permitir navegación programática cuando sea necesario
        window.allowNavigationBack = function() {
            sessionStorage.removeItem('blockBackToFacturacion');
            console.log('Navegación hacia atrás permitida');
        };
        
        // Función para verificar si el bloqueo está activo
        window.isBackNavigationBlocked = function() {
            return sessionStorage.getItem('blockBackToFacturacion') === 'true';
        };
        
    })();
});