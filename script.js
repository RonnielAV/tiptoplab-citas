document.addEventListener('DOMContentLoaded', function() {
    // Variables para almacenar la selección
    let selectedService = null;
    let selectedDate = null;
    let selectedTime = null;
    
    // Elementos del DOM
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    const appointmentForm = document.getElementById('appointment-form');
    const successMessage = document.getElementById('success-message');
    
    // Inicializar el primer paso
    steps[0].classList.add('active');
    stepContents[0].style.display = 'block';
    
    // Ocultar los demás pasos
    for (let i = 1; i < stepContents.length; i++) {
        stepContents[i].style.display = 'none';
    }
    
    // Manejo de pasos
    function updateActiveStep(stepNumber) {
        // Actualizar indicadores de paso
        steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.getAttribute('data-step')) < stepNumber) {
                step.classList.add('completed');
            } else {
                step.classList.remove('completed');
            }
            if (parseInt(step.getAttribute('data-step')) === stepNumber) {
                step.classList.add('active');
            }
        });
        
        // Mostrar/ocultar contenido de pasos
        stepContents.forEach(content => {
            content.style.display = 'none';
            if (content.id === `step-${stepNumber}`) {
                content.style.display = 'block';
            }
        });
    }
    
    // Botones de navegación
    document.querySelectorAll('.next-button').forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.getAttribute('data-next'));
            
            // Validaciones antes de avanzar
            if (nextStep === 2 && !selectedService) {
                showError('Por favor, selecciona un servicio para continuar.');
                return;
            }
            
            if (nextStep === 3) {
                const dateInput = document.getElementById('appointment-date');
                if (!dateInput.value) {
                    showError('Por favor, selecciona una fecha para continuar.');
                    return;
                }
                if (!selectedTime) {
                    showError('Por favor, selecciona un horario disponible para continuar.');
                    return;
                }
            }
            
            if (nextStep === 4) {
                const nameInput = document.getElementById('client-name');
                const phoneInput = document.getElementById('client-phone');
                const emailInput = document.getElementById('client-email');
                
                if (!nameInput.value || !phoneInput.value || !emailInput.value) {
                    showError('Por favor, completa todos los campos obligatorios.');
                    return;
                }
                
                // Actualizar resumen de confirmación
                updateConfirmationDetails();
            }
            
            updateActiveStep(nextStep);
            
            // Scroll al inicio del formulario
            appointmentForm.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.getAttribute('data-back'));
            updateActiveStep(prevStep);
            
            // Scroll al inicio del formulario
            appointmentForm.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Selección de servicio
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            serviceCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedService = {
                id: this.getAttribute('data-service-id'),
                name: this.querySelector('.service-name').textContent
            };
            saveFormToCache(); // Guardar selección de servicio
        });
    });
    
    // Manejo de fecha y generación de horarios
    const dateInput = document.getElementById('appointment-date');
    dateInput.addEventListener('change', function() {
        selectedDate = this.value;
        generateTimeSlots(this.value);
        saveFormToCache(); // Guardar fecha
    });
    
    // Establecer fecha mínima como hoy
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);
    
    function generateTimeSlots(date) {
        const timeSlotsContainer = document.getElementById('time-slots-container');
        timeSlotsContainer.innerHTML = ''; // Limpiar horarios anteriores
        selectedTime = null; // Resetear hora seleccionada al cambiar de fecha
        
        const selectedDateObj = new Date(date + 'T00:00:00'); // Asegurar que se interprete en zona horaria local
        const dayOfWeek = selectedDateObj.getDay(); 
        let startHour = 9;
        let endHour = 20; 
        let lastMinute = 30;

        if (dayOfWeek === 0) { // Domingo
            endHour = 14; 
            lastMinute = 0; 
        }
        
        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
                if (hour === endHour && minutes > lastMinute) continue;
                if (dayOfWeek === 0 && hour === 14 && minutes > 0) continue; // No mostrar después de 14:00 los domingos
                if (dayOfWeek === 0 && hour > 14) continue;


                const timeString24 = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                const timeString12 = formatTime12h(hour, minutes);
                
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = timeString12;
                timeSlot.setAttribute('data-time24', timeString24);
                timeSlot.addEventListener('click', function() {
                    document.querySelectorAll('.time-slot').forEach(slot => {
                        slot.classList.remove('selected');
                    });
                    this.classList.add('selected');
                    selectedTime = this.textContent; // Guardar en formato 12h como se muestra
                    saveFormToCache(); // Guardar hora seleccionada
                });
                timeSlotsContainer.appendChild(timeSlot);
            }
        }
    }
    
    function formatTime12h(hour, minutes) {
        let period = 'am';
        let h = hour;
        if (hour === 0) {
            h = 12;
        } else if (hour === 12) {
            period = 'pm';
        } else if (hour > 12) {
            h = hour - 12;
            period = 'pm';
        }
        return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    // Actualizar detalles de confirmación
    function updateConfirmationDetails() {
        document.getElementById('confirm-service').textContent = selectedService ? selectedService.name : 'No seleccionado';
        
        if (selectedDate) {
            const dateObj = new Date(selectedDate + 'T00:00:00'); // Asegurar zona horaria local
            const formattedDate = dateObj.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            document.getElementById('confirm-date').textContent = formattedDate;
        } else {
            document.getElementById('confirm-date').textContent = 'No seleccionada';
        }
        
        document.getElementById('confirm-time').textContent = selectedTime || 'No seleccionado';
        document.getElementById('confirm-name').textContent = document.getElementById('client-name').value;
        document.getElementById('confirm-phone').textContent = document.getElementById('client-phone').value;
        document.getElementById('confirm-email').textContent = document.getElementById('client-email').value;
        document.getElementById('confirm-notes').textContent = document.getElementById('client-notes').value || 'Ninguna';
    }
    
    // Manejar envío del formulario
    appointmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const phoneInput = document.getElementById('client-phone');
        const phoneValue = phoneInput.value.trim();
        if (!/^\d{10}$/.test(phoneValue)) {
            showError('El número de teléfono debe tener exactamente 10 dígitos.');
            phoneInput.focus();
            return;
        }
        
        const confirmButton = document.getElementById('confirm-button');
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'; // Usamos Font Awesome para el spinner
        
        const datosCita = {
            servicio: selectedService ? selectedService.name : 'No especificado',
            fecha: document.getElementById('appointment-date').value, // Formato YYYY-MM-DD
            hora: selectedTime || 'No especificada', // Formato 12h AM/PM
            name: document.getElementById('client-name').value,
            telefono: phoneValue,
            email: document.getElementById('client-email').value,
            notas: document.getElementById('client-notes').value || 'Ninguna'
        };
        enviarCorreoCita(datosCita);

        // --- INICIO: Código para preparar el enlace de WhatsApp ---
        const whatsappPhoneNumber = '18096429619'; // Tu número de WhatsApp
        let messageText = `¡Hola! 😊 Quisiera solicitar una cita con los siguientes detalles:\n\n`;
        messageText += `*Servicio:* ${datosCita.servicio}\n`;
        messageText += `*Fecha:* ${datosCita.fecha}\n`;
        messageText += `*Hora:* ${datosCita.hora}\n`;
        messageText += `*Nombre:* ${datosCita.name}\n`;
        if (datosCita.email) {
            messageText += `*Email:* ${datosCita.email}\n`;
        }
        messageText += `*Notas:* ${datosCita.notas}\n\n`;
        messageText += `Espero su confirmación. ¡Gracias! ✨`;

        const encodedMessage = encodeURIComponent(messageText);
        const whatsappLinkElement = document.getElementById('whatsapp-link-success');
        
        if (whatsappLinkElement) {
            whatsappLinkElement.href = `https://wa.me/${whatsappPhoneNumber}?text=${encodedMessage}`;
        }
        // --- FIN: Código para preparar el enlace de WhatsApp ---

        // Simular envío al servidor y mostrar mensaje de éxito
        setTimeout(() => {
            appointmentForm.style.display = 'none';
            successMessage.style.display = 'block';
            clearFormCache(); // Limpiar cache DESPUÉS de procesar y justo antes de mostrar éxito
        }, 1500);
    });
    
    // Botón para programar nueva cita
    document.getElementById('new-appointment').addEventListener('click', function() {
        appointmentForm.reset();
        selectedService = null;
        selectedDate = null;
        selectedTime = null;
        
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById('time-slots-container').innerHTML = ''; // Limpiar horarios
        
        updateActiveStep(1);
        
        appointmentForm.style.display = 'block';
        successMessage.style.display = 'none';
        
        const confirmButton = document.getElementById('confirm-button');
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Confirmar Cita <i class="fas fa-check"></i>';
        clearFormCache(); // Limpiar cache al iniciar nueva cita
    });
    
    // Función para mostrar errores
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message'; // Usa la clase CSS definida
        // El estilo inline ahora solo añade lo que no esté en la clase .error-message
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorDiv.style.cssText = ` 
            padding: 1rem; /* Redundante si .feedback-message ya lo tiene */
            border-radius: 4px; /* Redundante si .feedback-message ya lo tiene */
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background-color: var(--color-error); /* Asegura que use el color de error */
            color: white; /* Asegura que use el color de texto para error */
        `;
        
        const activeStepContent = document.querySelector('.step-content[style*="display: block"]');
        if (activeStepContent) { // Asegurarse de que el paso activo existe
             activeStepContent.insertBefore(errorDiv, activeStepContent.firstChild);
        }
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    function enviarCorreoCita(datos) {
        // Reemplaza 'service_xxxxxxx', 'template_xxxxxxx' con tus IDs de EmailJS
        emailjs.send('service_bzq4kz8', 'template_tuao2a8', datos)
            .then(function(response) {
                console.log('Correo enviado con éxito', response.status, response.text);
            }, function(error) {
                console.error('Error al enviar el correo', error);
                // Opcional: Mostrar un mensaje de error más amigable al usuario si el correo falla
                // showError('Hubo un problema al enviar la notificación por correo. Por favor, contacta directamente.');
            });
    }

    // Guardar y recuperar datos del formulario usando localStorage
    const FORM_STORAGE_KEY = 'tiptop_cita_form';

    function saveFormToCache() {
        const data = {
            servicioId: selectedService ? selectedService.id : null, // Guardar ID para restaurar selección
            fecha: document.getElementById('appointment-date').value,
            hora: selectedTime, // Guardar hora seleccionada (formato 12h)
            nombre: document.getElementById('client-name').value,
            telefono: document.getElementById('client-phone').value,
            email: document.getElementById('client-email').value,
            notas: document.getElementById('client-notes').value
        };
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
    }

    function loadFormFromCache() {
        const dataString = localStorage.getItem(FORM_STORAGE_KEY);
        if (!dataString) return;

        const data = JSON.parse(dataString);
        
        if (data.servicioId) {
            const card = document.querySelector(`.service-card[data-service-id="${data.servicioId}"]`);
            if (card) {
                card.click(); // Simular click para seleccionar y actualizar selectedService
            }
        }
        if (data.fecha) {
            dateInput.value = data.fecha;
            selectedDate = data.fecha; // Actualizar variable
            generateTimeSlots(data.fecha); // Generar horarios para la fecha cargada
        }
        if (data.hora && data.fecha) { // Asegurarse que la fecha esté cargada para que existan los slots
            // Esperar un poco para que los time slots se generen si la fecha se acaba de setear
            setTimeout(() => {
                const slots = document.querySelectorAll('.time-slot');
                slots.forEach(slot => {
                    if (slot.textContent === data.hora) {
                        slot.click(); // Simular click para seleccionar y actualizar selectedTime
                    }
                });
            }, 200); // Un pequeño delay
        }
        if (data.nombre) document.getElementById('client-name').value = data.nombre;
        if (data.telefono) document.getElementById('client-phone').value = data.telefono;
        if (data.email) document.getElementById('client-email').value = data.email;
        if (data.notas) document.getElementById('client-notes').value = data.notas;
    }

    function clearFormCache() {
        localStorage.removeItem(FORM_STORAGE_KEY);
    }

    // Guardar datos al escribir en los campos de texto/email/notas
    ['client-name','client-phone','client-email','client-notes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', saveFormToCache);
        }
    });
    // El guardado para 'appointment-date' y 'time-slots' ya se maneja en sus respectivos event listeners.


    // Cargar datos al iniciar
    loadFormFromCache();

    // No necesitamos limpiar la cache explícitamente en 'submit' o 'new-appointment' aquí
    // porque ya se hace dentro de esas funciones (o justo después del envío).

    // Bloquear entrada de letras y caracteres no numéricos en el campo de teléfono
    const phoneInputGlobal = document.getElementById('client-phone'); // Renombrado para evitar conflicto
    if(phoneInputGlobal) {
        phoneInputGlobal.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
});
