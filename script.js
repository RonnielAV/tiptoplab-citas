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
            saveFormToCache();
        });
    });
    
    // Manejo de fecha y generación de horarios
    const dateInput = document.getElementById('appointment-date');
    dateInput.addEventListener('change', function() {
        selectedDate = this.value;
        generateTimeSlots(this.value);
    });
    
    // Establecer fecha mínima como hoy
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);
    
    function generateTimeSlots(date) {
        const timeSlotsContainer = document.getElementById('time-slots-container');
        timeSlotsContainer.innerHTML = '';
        
        // Determinar el día de la semana
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay(); // 0 = domingo, 1 = lunes, ...
        let startHour = 9;
        let endHour = 20;
        let lastMinute = 30;
        if (dayOfWeek === 0) { // Domingo
            endHour = 14;
            lastMinute = 0; // Solo mostrar 14:00, no 14:30 ni posteriores
        }
        
        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
                if (hour === endHour && minutes > lastMinute) continue;
                if (dayOfWeek === 0 && hour > 14) continue; // Seguridad extra: nunca mostrar después de 14:00 los domingos
                const timeString24 = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                const timeString12 = formatTime12h(hour, minutes);
                
                // Todos los horarios están disponibles
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = timeString12;
                timeSlot.setAttribute('data-time24', timeString24);
                timeSlot.addEventListener('click', function() {
                    document.querySelectorAll('.time-slot').forEach(slot => {
                        slot.classList.remove('selected');
                    });
                    this.classList.add('selected');
                    selectedTime = this.textContent;
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
        document.getElementById('confirm-service').textContent = selectedService.name;
        
        // Formatear fecha para mostrar
        const dateObj = new Date(selectedDate);
        const formattedDate = dateObj.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('confirm-date').textContent = formattedDate;
        
        document.getElementById('confirm-time').textContent = selectedTime;
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
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        
        // Enviar correo con los datos de la cita
        const datosCita = {
            servicio: selectedService ? selectedService.name : '',
            fecha: document.getElementById('appointment-date').value,
            hora: selectedTime,
            name: document.getElementById('client-name').value,
            telefono: phoneValue,
            email: document.getElementById('client-email').value,
            notas: document.getElementById('client-notes').value
        };
        enviarCorreoCita(datosCita);

        // Simular envío al servidor
        setTimeout(() => {
            appointmentForm.style.display = 'none';
            successMessage.style.display = 'block';
        }, 1500);
    });
    
    // Botón para programar nueva cita
    document.getElementById('new-appointment').addEventListener('click', function() {
        // Reiniciar formulario
        appointmentForm.reset();
        selectedService = null;
        selectedDate = null;
        selectedTime = null;
        
        // Quitar selecciones
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Volver al primer paso
        updateActiveStep(1);
        
        // Mostrar formulario y ocultar mensaje de éxito
        appointmentForm.style.display = 'block';
        successMessage.style.display = 'none';
        
        const confirmButton = document.getElementById('confirm-button');
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Confirmar Cita <i class="fas fa-check"></i>';
    });
    
    // Función para mostrar errores
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorDiv.style.cssText = `
            background-color: var(--color-error-red);
            color: white;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        const activeStep = document.querySelector('.step-content[style*="display: block"]');
        activeStep.insertBefore(errorDiv, activeStep.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    function enviarCorreoCita(datos) {
        emailjs.send('service_bzq4kz8', 'template_tuao2a8', datos)
            .then(function(response) {
                console.log('Correo enviado con éxito', response.status, response.text);
            }, function(error) {
                console.error('Error al enviar el correo', error);
            });
    }

    // Guardar y recuperar datos del formulario usando localStorage
    const FORM_STORAGE_KEY = 'tiptop_cita_form';

    function saveFormToCache() {
        const data = {
            servicio: selectedService ? selectedService.name : '',
            servicioId: selectedService ? selectedService.id : '',
            fecha: document.getElementById('appointment-date').value,
            hora: selectedTime,
            nombre: document.getElementById('client-name').value,
            telefono: document.getElementById('client-phone').value,
            email: document.getElementById('client-email').value,
            notas: document.getElementById('client-notes').value
        };
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
    }

    function loadFormFromCache() {
        const data = JSON.parse(localStorage.getItem(FORM_STORAGE_KEY) || '{}');
        if (data.servicioId) {
            const card = document.querySelector(`.service-card[data-service-id="${data.servicioId}"]`);
            if (card) {
                card.classList.add('selected');
                selectedService = {
                    id: card.getAttribute('data-service-id'),
                    name: card.querySelector('.service-name').textContent
                };
            }
        }
        if (data.fecha) {
            document.getElementById('appointment-date').value = data.fecha;
            generateTimeSlots(data.fecha);
        }
        if (data.hora) {
            setTimeout(() => {
                const slot = Array.from(document.querySelectorAll('.time-slot')).find(s => s.textContent === data.hora);
                if (slot) {
                    slot.classList.add('selected');
                    selectedTime = slot.textContent;
                }
            }, 200);
        }
        if (data.nombre) document.getElementById('client-name').value = data.nombre;
        if (data.telefono) document.getElementById('client-phone').value = data.telefono;
        if (data.email) document.getElementById('client-email').value = data.email;
        if (data.notas) document.getElementById('client-notes').value = data.notas;
    }

    function clearFormCache() {
        localStorage.removeItem(FORM_STORAGE_KEY);
    }

    // Guardar datos al escribir en los campos
    ['client-name','client-phone','client-email','client-notes','appointment-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', saveFormToCache);
        }
    });

    // Guardar selección de horario
    const timeSlotsContainer = document.getElementById('time-slots-container');
    timeSlotsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('time-slot')) {
            saveFormToCache();
        }
    });

    // Cargar datos al iniciar
    loadFormFromCache();

    // Limpiar cache al enviar o reiniciar
    appointmentForm.addEventListener('submit', function() {
        clearFormCache();
    });
    document.getElementById('new-appointment').addEventListener('click', function() {
        clearFormCache();
    });

    // Bloquear entrada de letras y caracteres no numéricos en el campo de teléfono
    const phoneInput = document.getElementById('client-phone');
    phoneInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
}); 