/** Copy for the blocks shared by the home and other pages: the comparison, the product (dashboard) and "what happens next". */
const en = {
    cmpName: 'Compare',
    cmp: { h: ['Three ways to get', 'a site built.'], lead: 'I work this way because the other two leave you alone after launch.', cols: ['A typical agency', 'A freelancer by the hour', 'Working with me'], best: 'This one',
      rows: [
        ['Who you talk to', 'An account manager', 'The freelancer, when free', 'The person doing the work'],
        ['What you pay', 'A quote per project', 'Hours, hard to predict', 'A clear quote before starting'],
        ['Changes after launch', 'A new quote each time', 'A new invoice each time', 'Send a request from your dashboard'],
        ['Work in parallel', 'Depends on the team', 'One thing at a time', 'Several requests at once'],
        ['Design, code, brand, marketing', 'Several people', 'Usually one skill', 'All four, one person'],
        ['If you want to stop', 'Contract terms', 'Depends', 'No lock-in'],
        ['Code and accounts', 'Ask first', 'Ask first', 'Yours from day one'],
      ], foot: 'Agencies and freelancers vary; this is the usual case, not every case.' },
    appName: 'Dashboard',
    app: { h: ['Your studio,', 'in one tab.'], lead: 'Every client gets their own dashboard. Send a request in a minute, watch it move, approve it, and see what was delivered.', demo: 'Try the live demo', note: 'No account needed', alt: 'The client dashboard',
      tabs: [['Overview', 'What is moving now, what waits for you, what was delivered.', 'overview'], ['Requests', 'Your queue as a board. Drag to choose what starts next.', 'board'], ['Calendar', 'Deadlines, expected deliveries and what repeats.', 'calendar']] },
    next: { h: 'What happens next', steps: [['Tell me about the project', 'A short message is enough.'], ['A 20-minute call', 'I learn the business and what to build first.'], ['Your dashboard and first request', 'Usually within 48 hours.']] },
}
const es: typeof en = {
    cmpName: 'Comparar',
    cmp: { h: ['Tres formas de hacer', 'un sitio.'], lead: 'Trabajo así porque las otras dos te dejan solo después del lanzamiento.', cols: ['Una agencia típica', 'Un freelancer por hora', 'Trabajar conmigo'], best: 'Este',
      rows: [
        ['Con quién hablas', 'Un ejecutivo de cuentas', 'El freelancer, cuando puede', 'Quien hace el trabajo'],
        ['Qué pagas', 'Un presupuesto por proyecto', 'Horas, difícil de prever', 'Un presupuesto claro antes de empezar'],
        ['Cambios después de lanzar', 'Un presupuesto nuevo cada vez', 'Una factura nueva cada vez', 'Mandas un pedido desde tu panel'],
        ['Trabajo en paralelo', 'Depende del equipo', 'Una cosa a la vez', 'Varios pedidos a la vez'],
        ['Diseño, código, marca, marketing', 'Varias personas', 'Normalmente una sola habilidad', 'Las cuatro, una persona'],
        ['Si quieres parar', 'Según el contrato', 'Depende', 'Sin permanencia'],
        ['Código y cuentas', 'Hay que pedirlos', 'Hay que pedirlos', 'Tuyos desde el primer día'],
      ], foot: 'Las agencias y los freelancers varían; este es el caso habitual, no todos los casos.' },
    appName: 'Tu panel',
    app: { h: ['Tu estudio,', 'en una pestaña.'], lead: 'Cada cliente tiene su propio panel. Mandas un pedido en un minuto, lo ves avanzar, lo apruebas y ves lo que se entregó.', demo: 'Probar la demo en vivo', note: 'Sin crear cuenta', alt: 'El panel del cliente',
      tabs: [['Resumen', 'Qué se está moviendo, qué espera por ti y qué se entregó.', 'overview'], ['Pedidos', 'Tu cola en un tablero. Arrastras para elegir qué arranca.', 'board'], ['Calendario', 'Fechas límite, entregas estimadas y lo que se repite.', 'calendar']] },
    next: { h: 'Qué pasa después', steps: [['Me cuentas el proyecto', 'Alcanza con un mensaje corto.'], ['Una llamada de 20 minutos', 'Conozco el negocio y qué construir primero.'], ['Tu panel y tu primer pedido', 'Normalmente en 48 horas.']] },
}
export const blocks = { en, es }
