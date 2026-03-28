// Universal runtime translations for pages without explicit data-i18n coverage.
(function () {
  var path = String(window.location.pathname || '').toLowerCase();
  var htmlLang = String(document.documentElement.getAttribute('lang') || '').toLowerCase();
  var stored = String(localStorage.getItem('klarity-lang') || 'es').toLowerCase();
  var lang = stored;
  if (path === '/en' || path.endsWith('/src/html/en.html') || htmlLang === 'en') {
    lang = 'en';
  }
  if (lang !== 'en') return;

  var replacements = [
    ['Cómo funciona', 'How it works'],
    ['Como funciona', 'How it works'],
    ['Funciones', 'Features'],
    ['Precios', 'Pricing'],
    ['Demo Lab', 'Demo Lab'],
    ['Demo', 'Demo'],
    ['Sabe exactamente', 'Know exactly'],
    ['adónde va tu dinero.', 'where your money goes.'],
    ['Obtene recomendaciones de un asesor financiero real y convierte tus numeros en decisiones claras.', 'Get recommendations from a real financial advisor and turn your numbers into clear decisions.'],
    ['Klarity unifica tus gastos, tickets y presupuestos en un solo lugar. Obtene recomendaciones de un asesor financiero real y convierte tus numeros en decisiones claras.', 'Klarity unifies your expenses, receipts and budgets in one place. Get recommendations from a real financial advisor and turn your numbers into clear decisions.'],
    ['Klarity unifica tus gastos, tickets y presupuestos en un solo lugar. Obtene recomendaciones de un asesor financiero real y convierte tus números en decisiones claras.', 'Klarity unifies your expenses, receipts and budgets in one place. Get recommendations from a real financial advisor and turn your numbers into clear decisions.'],
    ['Klarity unifica tus gastos, tickets y presupuestos en un solo lugar.', 'Klarity unifies your expenses, receipts and budgets in one place.'],
    ['Registra gastos en segundos, analiza patrones con IA y toma decisiones que realmente importan.', 'Log expenses in seconds, analyse patterns with AI and make decisions that actually matter.'],
    ['Ver demo', 'Watch demo'],
    ['Resumen del mes', 'Monthly overview'],
    ['Gastos', 'Expenses'],
    ['Presup.', 'Budget'],
    ['Ahorrado', 'Saved'],
    ['Supermercado', 'Supermarket'],
    ['Streaming', 'Streaming'],
    ['Farmacia', 'Pharmacy'],
    ['gastos registrados', 'logged expenses'],
    ['% satisfaccion', '% satisfaction'],
    ['satisfaccion', 'satisfaction'],
    ['asesores certificados', 'certified advisors'],
    ['Tres pasos para tener claridad total', 'Three steps to gain full clarity'],
    ['Sin configuraciones complicadas. Empeza en minutos y ve resultados desde el primer dia.', 'No complex setup. Start in minutes and see results from day one.'],
    ['Crea tu cuenta gratis', 'Create your free account'],
    ['Registro en 30 segundos. Solo email y contraseña, sin datos bancarios. La seguridad es nuestra prioridad.', 'Sign up in 30 seconds. Just email and password, no banking data. Security is our priority.'],
    ['Registra tus gastos y tickets', 'Log your expenses and receipts'],
    ['Ingrasa manualmente o fotografia tu ticket y la IA extrae los datos automaticamente con OCR. Multidivisa incluido.', 'Add them manually or scan your receipt and AI extracts data automatically with OCR. Multi-currency included.'],
    ['Optimiza con tu asesor financiero', 'Optimise with your financial advisor'],
    ['Accede al panel del asesor, consulta el chatbot financiero personalizado y cumple tus metas con gamificacion.', 'Use the advisor panel, ask the personalised financial chatbot and reach your goals with gamification.'],
    ['Empieza en minutos, no dias', 'Start in minutes, not days'],
    ['Sin integraciones bancarias complejas ni migraciones manuales.', 'No complex bank integrations or manual migrations.'],
    ['Ingreso rapido de gastos', 'Fast expense entry'],
    ['OCR para tickets fisicos y digitales', 'OCR for physical and digital receipts'],
    ['Asesor financiero incluido', 'Financial advisor included'],
    ['Gamificacion y metas mensuales', 'Gamification and monthly goals'],
    ['Funciones que hacen la diferencia', 'Features that make the difference'],
    ['Cada herramienta fue diseñada para que entiendas tus finanzas, no para que las compliques.', 'Every tool is designed so you understand your finances, not complicate them.'],
    ['Fotografia cualquier comprobante y la inteligencia artificial extrae monto, fecha y categoria automaticamente.', 'Photograph any receipt and AI extracts amount, date and category automatically.'],
    ['Registra en ARS, USD o EUR. Klarity convierte en tiempo real y unifica tu vision financiera sin importar la moneda.', 'Log in ARS, USD or EUR. Klarity converts in real time and unifies your financial view regardless of currency.'],
    ['Preguntale al chatbot sobre tus patrones de consumo, proyecciones y estrategias de ahorro. Disponible 24/7.', 'Ask the chatbot about your spending patterns, projections and saving strategies. Available 24/7.'],
    ['Gestiona tus gastos recurrentes. Klarity te avisa antes de cada vencimiento y calcula el total mensual comprometido.', 'Manage your recurring expenses. Klarity alerts you before each due date and calculates your monthly committed total.'],
    ['Divide cualquier gasto entre varias personas. Klarity calcula cuanto le corresponde a cada uno automaticamente.', 'Split any expense among multiple people. Klarity automatically calculates each share.'],
    ['Cumple metas de gasto mensual y gana medallas. La motivacion hace que ahorrar sea algo que quieras hacer.', 'Reach monthly spending goals and earn badges. Motivation makes saving something you want to do.'],
    ['Personas reales, resultados reales', 'Real people, real results'],
    ['Miles de usuarios ya controlan sus finanzas con Klarity. Estas son sus historias.', 'Thousands of users already control their finances with Klarity. These are their stories.'],
    ['Simple y transparente', 'Simple and transparent'],
    ['Comenza gratis, actualiza cuando quieras. Sin compromisos, sin letras chicas.', 'Start free, upgrade whenever you want. No commitments, no hidden terms.'],
    ['/ siempre', '/ forever'],
    ['Hasta 100 gastos por mes', 'Up to 100 expenses per month'],
    ['Categorias automaticas', 'Automatic categories'],
    ['OCR de tickets (5/mes)', 'Receipt OCR (5/month)'],
    ['Chatbot financiero basico', 'Basic financial chatbot'],
    ['Asesor financiero personal', 'Personal financial advisor'],
    ['Reportes avanzados', 'Advanced reports'],
    ['MAS POPULAR', 'MOST POPULAR'],
    ['Para quienes toman en serio sus finanzas', 'For people serious about their finances'],
    ['USD / mes', 'USD / month'],
    ['Gastos ilimitados', 'Unlimited expenses'],
    ['OCR ilimitado', 'Unlimited OCR'],
    ['Reportes y visualizaciones avanzadas', 'Advanced reports and visualisations'],
    ['Multi-divisa avanzado', 'Advanced multi-currency'],
    ['Soporte prioritario', 'Priority support'],
    ['Probar Pro gratis 30 dias', 'Try Pro free for 30 days'],
    ['¿Tenes dudas? Nosotros las respondemos.', 'Have questions? We answer them.'],
    ['¿Es seguro guardar mis datos financieros en Klarity?', 'Is it safe to store my financial data in Klarity?'],
    ['Absolutamente. Todos los datos se transmiten con cifrado TLS y se almacenan en servidores seguros. Nunca pedimos datos bancarios ni acceso a tus cuentas. Solo registras lo que vos queres.', 'Absolutely. All data is transmitted with TLS encryption and stored on secure servers. We never ask for bank access. You only log what you want.'],
    ['¿Puedo usar Klarity sin tarjeta de credito?', 'Can I use Klarity without a credit card?'],
    ['Si, el plan Free es completamente gratuito y no requiere tarjeta. Solo necesitas un email para registrarte. El plan Pro tiene 30 dias de prueba gratuita.', 'Yes, the Free plan is fully free and does not require a card. You only need an email to sign up. Pro includes a 30-day free trial.'],
    ['¿Como funciona el OCR de tickets?', 'How does receipt OCR work?'],
    ['Subis una foto o PDF del comprobante y nuestra IA (Tesseract.js) extrae automaticamente el monto, la fecha y sugiere una categoria. En el plan Free tenes 5 escaneos por mes, ilimitados en Pro.', 'Upload a photo or PDF receipt and our AI (Tesseract.js) extracts amount, date and suggests a category automatically. Free plan includes 5 scans/month, unlimited in Pro.'],
    ['¿Que diferencia hay entre usuario, asesor y admin?', 'What is the difference between user, advisor and admin?'],
    ['Los usuarios registran sus gastos y consultan el chatbot. Los asesores financieros certificados pueden ver y analizar los gastos de sus clientes. Los administradores gestionan la plataforma completa.', 'Users log expenses and consult the chatbot. Certified advisors can view and analyse client spending. Admins manage the whole platform.'],
    ['¿Puedo exportar mis datos?', 'Can I export my data?'],
    ['Si. Podes exportar todos tus gastos en formato CSV o PDF en cualquier momento. Tus datos son tuyos y siempre podes llevartelos.', 'Yes. You can export all your expenses as CSV or PDF at any time. Your data is yours and you can always take it with you.'],
    ['Proba el sistema en vivo: multi-divisa, suscripciones, gastos compartidos, asesor y gamificacion.', 'Try the system live: multi-currency, subscriptions, shared expenses, advisor and gamification.'],
    ['Sesion y perfil', 'Session and profile'],
    ['Sin sesion iniciada.', 'No active session.'],
    ['Nombre', 'Name'],
    ['Email', 'Email'],
    ['Guardar perfil', 'Save profile'],
    ['Cerrar sesion', 'Log out'],
    ['Carga de ticket con OCR (IA)', 'Receipt upload with OCR (AI)'],
    ['Imagen del ticket', 'Receipt image'],
    ['Interpretar', 'Parse'],
    ['Registro multi-divisa', 'Multi-currency entry'],
    ['Alimentacion', 'Food'],
    ['Transporte', 'Transport'],
    ['Ocio', 'Leisure'],
    ['Suscripciones', 'Subscriptions'],
    ['Salud', 'Health'],
    ['Vivienda', 'Housing'],
    ['Otros', 'Other'],
    ['Monto', 'Amount'],
    ['Personas para dividir', 'People to split with'],
    ['Guardar gasto', 'Save expense'],
    ['Cargando cotizaciones...', 'Loading rates...'],
    ['Suscripciones recurrentes', 'Recurring subscriptions'],
    ['Servicio', 'Service'],
    ['Dia', 'Day'],
    ['Agregar suscripcion', 'Add subscription'],
    ['Chatbot asesor financiero', 'Financial advisor chatbot'],
    ['Modo', 'Mode'],
    ['Asesor local', 'Local advisor'],
    ['API Key (opcional)', 'API Key (optional)'],
    ['Tu consulta', 'Your question'],
    ['Escribe una pregunta para obtener recomendaciones.', 'Write a question to get recommendations.'],
    ['Gamificacion de metas', 'Goal gamification'],
    ['Tope ARS/mes', 'ARS cap/month'],
    ['Medalla al cumplir 3 meses seguidos por debajo del tope.', 'Badge for staying below the cap for 3 consecutive months.'],
    ['Panel de asesor financiero', 'Financial advisor panel'],
    ['User ID a analizar', 'User ID to analyse'],
    ['Ver overview global', 'View global overview'],
    ['Ver patrones del usuario', 'View user patterns'],
    ['Disponible para cuentas con rol asesor.', 'Available for advisor-role accounts.'],
    ['Unete a miles de personas que ya conocen exactamente a donde va su dinero. Sin tarjeta, sin compromisos.', 'Join thousands of people who already know exactly where their money goes. No card, no commitment.'],
    ['Ya son +12.000 usuarios. Plan gratuito para siempre disponible.', 'Already +12,000 users. Free plan always available.'],
    ['Todos los derechos reservados.', 'All rights reserved.'],
    ['Proyecto Ingeniería Web II · Universidad', 'Web Engineering II Project - University'],
    ['Conoce exactamente', 'Know exactly'],
    ['a donde va tu dinero.', 'where your money goes.'],
    ['Gestion financiera inteligente', 'Smart financial management'],
    ['Gestión financiera inteligente', 'Smart financial management'],
    ['Sin tarjeta requerida', 'No card required'],
    ['Gratis para siempre', 'Free forever'],
    ['Datos 100% seguros', '100% secure data'],
    ['Proceso simple', 'Simple process'],
    ['Todo incluido', 'All included'],
    ['Lo que dicen', 'What people say'],
    ['Preguntas frecuentes', 'Frequently asked questions'],
    ['Lab financiero', 'Financial lab'],
    ['Demo interactiva completa', 'Full interactive demo'],
    ['Comenzar gratis', 'Start free'],
    ['Comprobar', 'Check'],
    ['Comprobando...', 'Checking...'],
    ['Sin respuesta:', 'No response:'],
    ['Estado del sistema', 'System status'],
    ['Visión general', 'Overview'],
    ['Panel Admin', 'Admin panel'],
    ['Panel Asesor', 'Advisor panel'],
    ['Asesor', 'Advisor'],
    ['Administración', 'Administration'],
    ['Sistema', 'System'],
    ['Cuenta', 'Account'],
    ['Mi perfil', 'My profile'],
    ['Cerrar sesión', 'Log out'],
    ['Mis clientes', 'My clients'],
    ['Resumen de cliente', 'Client overview'],
    ['Patrones de gasto', 'Spending patterns'],
    ['Recomendaciones IA', 'AI recommendations'],
    ['Usuarios', 'Users'],
    ['Todos los gastos', 'All expenses'],
    ['Gestión de usuarios', 'User management'],
    ['Estado', 'Status'],
    ['Acciones', 'Actions'],
    ['Nombre', 'Name'],
    ['Correo electrónico', 'Email'],
    ['Correo', 'Email'],
    ['Contraseña', 'Password'],
    ['Bienvenido de vuelta', 'Welcome back'],
    ['Ingresa tus credenciales para continuar.', 'Enter your credentials to continue.'],
    ['Crear tu cuenta', 'Create your account'],
    ['Crear cuenta', 'Create account'],
    ['Entrar', 'Log in'],
    ['Ingresar', 'Log in'],
    ['Volver al inicio', 'Back to home'],
    ['Acceso seguro', 'Secure access'],
    ['Registra consumos, analiza categorias y recibe recomendaciones de tu asesor financiero. Todo en un solo lugar.', 'Track spending, analyse categories and get recommendations from your financial advisor. All in one place.'],
    ['Control diario de gastos con IA', 'Daily expense control with AI'],
    ['OCR de tickets y comprobantes', 'OCR for receipts and invoices'],
    ['Asesor financiero personalizado', 'Personal financial advisor'],
    ['Datos cifrados y 100% seguros', 'Encrypted and 100% secure data'],
    ['Cuentas demo disponibles', 'Demo accounts available'],
    ['Validando credenciales...', 'Validating credentials...'],
    ['Entrando...', 'Signing in...'],
    ['Creando cuenta...', 'Creating account...'],
    ['Creando...', 'Creating...'],
    ['Credenciales incorrectas.', 'Invalid credentials.'],
    ['No se pudo crear la cuenta.', 'Could not create the account.'],
    ['No se pudo conectar con el servidor.', 'Could not connect to the server.'],
    ['Bienvenido/a. Redirigiendo...', 'Welcome. Redirecting...'],
    ['Cuenta creada. Redirigiendo...', 'Account created. Redirecting...'],
    ['Principal', 'Main'],
    ['Herramientas', 'Tools'],
    ['Resumen', 'Overview'],
    ['Mis gastos', 'My expenses'],
    ['Añadir gasto', 'Add expense'],
    ['Subir ticket', 'Upload receipt'],
    ['Presupuestos', 'Budgets'],
    ['Asesor IA', 'AI advisor'],
    ['Buscar gastos...', 'Search expenses...'],
    ['Notificaciones', 'Notifications'],
    ['Cambiar tema', 'Toggle theme'],
    ['Hola — cargando...', 'Hello - loading...'],
    ['Total este mes', 'Total this month'],
    ['Mayor categoría', 'Top category'],
    ['Gastos totales', 'Total expenses'],
    ['Último gasto', 'Last expense'],
    ['Gasto por categoría', 'Spending by category'],
    ['Últimos gastos', 'Latest expenses'],
    ['Actualizar', 'Refresh'],
    ['Concepto', 'Concept'],
    ['Categoría', 'Category'],
    ['Importe', 'Amount'],
    ['Fecha', 'Date'],
    ['Insights rápidos', 'Quick insights'],
    ['Mes actual vs anterior', 'Current month vs previous'],
    ['Comercio más frecuente', 'Most frequent merchant'],
    ['Historial completo', 'Full history'],
    ['Todas las categorías', 'All categories'],
    ['Nuevo', 'New'],
    ['Registra un nuevo gasto manualmente', 'Register a new expense manually'],
    ['Nuevo gasto', 'New expense'],
    ['Concepto *', 'Concept *'],
    ['ej. Supermercado', 'e.g. Supermarket'],
    ['Importe *', 'Amount *'],
    ['Moneda', 'Currency'],
    ['Este gasto es mensual (alquiler, suscripción, etc.)', 'This expense is monthly (rent, subscription, etc.)'],
    ['Guardar gasto', 'Save expense'],
    ['Consejos rápidos', 'Quick tips'],
    ['Registra los gastos el mismo día para no olvidarlos.', 'Log expenses the same day so you do not forget them.'],
    ['Usar la misma categoría te ayuda a ver patrones.', 'Using the same category helps you spot patterns.'],
    ['¿Tienes ticket? Súbelo en la sección OCR y se añade solo.', 'Got a receipt? Upload it in the OCR section and it is added automatically.'],
    ['Extracción automática de texto con OCR', 'Automatic OCR text extraction'],
    ['Fotografía o archivo', 'Photo or file'],
    ['Imagen del ticket (JPG, PNG, PDF)', 'Receipt image (JPG, PNG, PDF)'],
    ['Procesar ticket', 'Process receipt'],
    ['Texto extraído', 'Extracted text'],
    ['Aquí aparecerá el texto extraído del ticket...', 'Extracted receipt text will appear here...'],
    ['Controla cuánto gastas por categoría', 'Control how much you spend by category'],
    ['Moneda de visualización', 'Display currency'],
    ['Comprometido del próximo mes', 'Committed for next month'],
    ['Comprometido del proximo mes', 'Committed for next month'],
    ['Cargando...', 'Loading...'],
    ['Análisis personalizado de tus finanzas', 'Personalized analysis of your finances'],
    ['Configuración', 'Settings'],
    ['Proveedor', 'Provider'],
    ['Pregunta', 'Question'],
    ['Consultar asesor', 'Ask advisor'],
    ['Respuesta', 'Response'],
    ['Haz una consulta al asesor para obtener análisis personalizados de tus gastos.', 'Ask the advisor to get personalized analyses of your expenses.'],
    ['Gestiona tu cuenta', 'Manage your account'],
    ['Datos de cuenta', 'Account details'],
    ['Tu nombre', 'Your name'],
    ['Guardar cambios', 'Save changes'],
    ['Información de sesión', 'Session information'],
    ['Rol:', 'Role:'],
    ['Sesión iniciada:', 'Session started:'],
    ['Abrir menú', 'Open menu'],
    ['Abrir menú lateral', 'Open side menu'],
    ['Cerrar menú lateral', 'Close side menu'],
    ['Menú', 'Menu'],
    ['Eliminar gasto', 'Delete expense'],
    ['¿Seguro que quieres eliminar este gasto? Esta acción no se puede deshacer.', 'Are you sure you want to delete this expense? This action cannot be undone.'],
    ['Cancelar', 'Cancel'],
    ['Eliminar', 'Delete'],
    ['Sin gastos aún', 'No expenses yet'],
    ['Sin datos', 'No data'],
    ['Sin concepto', 'No concept'],
    ['Sin movimiento en los últimos 2 meses', 'No activity in the last 2 months'],
    ['Nuevo gasto este mes:', 'New spending this month:'],
    ['veces', 'times'],
    ['Categoría sugerida aplicada:', 'Suggested category applied:'],
    ['Detectado como gasto mensual.', 'Detected as monthly expense.'],
    ['No se detectó categoría automática para este concepto.', 'No automatic category was detected for this concept.'],
    ['Guardando...', 'Saving...'],
    ['Gasto guardado correctamente.', 'Expense saved successfully.'],
    ['Procesando imagen...', 'Processing image...'],
    ['Error OCR', 'OCR error'],
    ['No se detectó un importe válido en el ticket.', 'No valid amount was detected in the receipt.'],
    ['No se pudo guardar el gasto desde OCR', 'Could not save expense from OCR'],
    ['Ticket procesado y gasto guardado automáticamente.', 'Receipt processed and expense saved automatically.'],
    ['Límite casi alcanzado', 'Limit almost reached'],
    ['Gasto elevado', 'High spending'],
    ['Sin gastos', 'No spending'],
    ['usado', 'used'],
    ['Todavía no hay suficientes gastos repetidos para estimar compromisos.', 'There are still not enough repeated expenses to estimate commitments.'],
    ['registros', 'records'],
    ['Total estimado próximo mes', 'Estimated total next month'],
    ['Total estimado proximo mes', 'Estimated total next month'],
    ['Consultando al asesor...', 'Asking the advisor...'],
    ['Problema principal', 'Main problem'],
    ['Diagnóstico', 'Diagnosis'],
    ['Solución recomendada', 'Recommended solution'],
    ['Próximo paso', 'Next step'],
    ['Perfil actualizado.', 'Profile updated.'],
    ['Buscar cliente por nombre o email', 'Search client by name or email'],
    ['Lista de usuarios asignados a tu asesoría', 'List of users assigned to your advisory'],
    ['Total clientes', 'Total clients'],
    ['Activos este mes', 'Active this month'],
    ['Gasto promedio', 'Average spending'],
    ['Clientes registrados', 'Registered clients'],
    ['Sin clientes', 'No clients'],
    ['Sin resultados', 'No results'],
    ['Alto riesgo', 'High risk'],
    ['Atencion', 'Warning'],
    ['Saludable', 'Healthy'],
    ['Ver resumen', 'View overview'],
    ['Patrones', 'Patterns'],
    ['Gastos e historial de un usuario específico', 'Expenses and history of a specific user'],
    ['Volver', 'Back'],
    ['Seleccionar cliente', 'Select client'],
    ['ID de usuario', 'User ID'],
    ['Ver resumen', 'View overview'],
    ['Introduce un ID de usuario para ver su resumen.', 'Enter a user ID to view overview.'],
    ['Análisis de comportamiento financiero por usuario', 'Financial behavior analysis by user'],
    ['Ver patrones', 'View patterns'],
    ['Introduce un ID para ver análisis de patrones.', 'Enter an ID to view pattern analysis.'],
    ['Genera sugerencias personalizadas de ahorro', 'Generate personalized savings suggestions'],
    ['Parámetros', 'Parameters'],
    ['ID de cliente', 'Client ID'],
    ['Proveedor IA', 'AI provider'],
    ['Generar recomendaciones', 'Generate recommendations'],
    ['Resultado', 'Result'],
    ['Selecciona un cliente y genera recomendaciones.', 'Select a client and generate recommendations.'],
    ['Historial guardado', 'Saved history'],
    ['Aun no hay recomendaciones guardadas.', 'There are no saved recommendations yet.'],
    ['Datos de tu cuenta de asesor', 'Your advisor account data'],
    ['No hay timeline disponible para este cliente.', 'No timeline is available for this client.'],
    ['Evolución del gasto', 'Spending trend'],
    ['Puntos de timeline', 'Timeline points'],
    ['Promedio período', 'Average period'],
    ['Alertas de pico', 'Peak alerts'],
    ['Introduce un ID de cliente.', 'Enter a client ID.'],
    ['Introduce un ID.', 'Enter an ID.'],
    ['Total gastado', 'Total spent'],
    ['Cantidad de gastos', 'Number of expenses'],
    ['Ticket promedio', 'Average ticket'],
    ['Categoría principal:', 'Top category:'],
    ['Sin distribución por categoría disponible.', 'No category distribution available.'],
    ['Estadísticas de la plataforma Klarity', 'Klarity platform statistics'],
    ['Total usuarios', 'Total users'],
    ['Asesores', 'Advisors'],
    ['Admins', 'Admins'],
    ['Distribución de roles', 'Role distribution'],
    ['Últimos usuarios registrados', 'Latest registered users'],
    ['Todos los usuarios de la plataforma', 'All users on the platform'],
    ['Buscar por nombre o email', 'Search by name or email'],
    ['Todos los roles', 'All roles'],
    ['Nuevos usuarios (últimos 6 meses)', 'New users (last 6 months)'],
    ['Vista de gastos (scope según permisos del backend)', 'Expense view (scope based on backend permissions)'],
    ['Comprueba la conectividad con el backend', 'Check connectivity with the backend'],
    ['Backend API', 'Backend API'],
    ['Información de entorno', 'Environment information'],
    ['Hora del servidor:', 'Server time:'],
    ['Cuenta de administrador', 'Administrator account'],
    ['Cambiar rol', 'Change role'],
    ['Usuario ID:', 'User ID:'],
    ['Guardar', 'Save'],
    ['Sin usuarios', 'No users'],
    ['Sin gastos', 'No expenses'],
    ['API accesible (HTTP', 'API reachable (HTTP'],
    ['Confirmar cambio de rol para', 'Confirm role change for'],
    ['Error:', 'Error:'],
    ['No se pudo actualizar cotización en vivo, usando referencia local.', 'Could not update live exchange rate, using local fallback.'],
    ['No se pudo actualizar cotizacion en vivo, usando referencia local.', 'Could not update live exchange rate, using local fallback.'],
    ['Tipo de cambio actualizado:', 'Exchange rate updated:'],
    ['Tipo de cambio actualizado', 'Exchange rate updated'],
    ['No se pudo actualizar cotización en vivo', 'Could not update live exchange rate'],
    ['No se pudo actualizar cotizacion en vivo', 'Could not update live exchange rate'],
    ['No se pudo interpretar el ticket.', 'Could not parse the receipt.'],
    ['Necesitas iniciar sesion para usar OCR de tickets del backend.', 'You need to log in to use backend receipt OCR.'],
    ['Procesando imagen con OCR...', 'Processing image with OCR...'],
    ['Ticket interpretado. Revisa los datos y guarda el gasto.', 'Receipt parsed. Review the data and save the expense.'],
    ['Inicia sesion para editar perfil.', 'Log in to edit profile.'],
    ['Perfil actualizado correctamente.', 'Profile updated successfully.'],
    ['No se pudo actualizar el perfil.', 'Could not update profile.'],
    ['Analizando tu consulta...', 'Analysing your query...'],
    ['Falta API Key de OpenAI. Respuesta local:', 'OpenAI API key missing. Local answer:'],
    ['Falta API Key de Gemini. Respuesta local:', 'Gemini API key missing. Local answer:'],
    ['Debes iniciar sesion como asesor.', 'You must log in as an advisor.'],
    ['No se pudo cargar overview.', 'Could not load overview.'],
    ['Ingresa un User ID para analizar.', 'Enter a User ID to analyse.'],
    ['No se pudo cargar patrones.', 'Could not load patterns.'],
    ['Sin sesion iniciada. Puedes usar modo local o iniciar desde login.', 'No active session. You can use local mode or log in.'],
    ['Sesion activa:', 'Active session:'],
    ['Gastos:', 'Expenses:'],
    ['Total bruto:', 'Gross total:'],
    ['Impacto real:', 'Real impact:'],
    ['Compartidos:', 'Shared:'],
    ['Todavia no hay gastos cargados.', 'No expenses loaded yet.'],
    ['Impacto', 'Impact'],
    ['persona/s', 'person(s)'],
    ['Comprometido proximo mes:', 'Committed next month:'],
    ['No hay suscripciones registradas.', 'No subscriptions registered.'],
    ['dia', 'day'],
    ['Posibles gastos recurrentes detectados:', 'Possible recurring expenses detected:'],
    ['Sin patrones recurrentes detectados todavia.', 'No recurring patterns detected yet.'],
    ['Sin medallas aun', 'No badges yet'],
    ['Medalla', 'Badge'],
    ['Cotizaciones base ARS:', 'Base ARS exchange rates:'],
    ['Ultima actualizacion:', 'Last update:'],
    ['no disponible', 'not available'],
    ['registros)', 'records)'],
    ['registros', 'records'],
    ['% usado', '% used'],
    ['Consultando al asesor...', 'Asking advisor...'],
    ['Problema principal', 'Main issue'],
    ['Diagnóstico', 'Diagnosis'],
    ['Solución recomendada', 'Recommended solution'],
    ['Próximo paso', 'Next step'],
    ['Perfil actualizado.', 'Profile updated.'],
    ['Cuenta creada. Redirigiendo...', 'Account created. Redirecting...'],
    ['Cuenta creada. Verifica tu correo para iniciar sesion.', 'Account created. Verify your email to log in.']
  ];

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  var compiled = replacements
    .slice()
    .sort(function (a, b) { return b[0].length - a[0].length; })
    .map(function (pair) {
      return [new RegExp(escapeRegExp(pair[0]), 'g'), pair[1]];
    });

  function translateText(text) {
    var out = text;
    for (var i = 0; i < compiled.length; i += 1) {
      out = out.replace(compiled[i][0], compiled[i][1]);
    }
    return out;
  }

  function translateAttributes(el) {
    var attrs = ['placeholder', 'title', 'aria-label'];
    for (var i = 0; i < attrs.length; i += 1) {
      var attr = attrs[i];
      var value = el.getAttribute(attr);
      if (value) {
        var translated = translateText(value);
        if (translated !== value) {
          el.setAttribute(attr, translated);
        }
      }
    }
  }

  function translateNode(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      var next = translateText(node.nodeValue || '');
      if (next !== node.nodeValue) {
        node.nodeValue = next;
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
    translateAttributes(node);

    var children = node.childNodes;
    for (var i = 0; i < children.length; i += 1) {
      translateNode(children[i]);
    }
  }

  function translateDocument() {
    translateNode(document.body);
    document.documentElement.lang = 'en';
  }

  var mo = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i += 1) {
      var mutation = mutations[i];
      if (mutation.type === 'characterData' && mutation.target) {
        translateNode(mutation.target);
      }
      if (mutation.type === 'childList' && mutation.addedNodes) {
        for (var j = 0; j < mutation.addedNodes.length; j += 1) {
          translateNode(mutation.addedNodes[j]);
        }
      }
      if (mutation.type === 'attributes' && mutation.target) {
        translateAttributes(mutation.target);
      }
    }
  });

  function start() {
    translateDocument();
    mo.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
