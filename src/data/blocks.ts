/** Copy for the blocks shared by the home and the pricing page: the comparison, the product (dashboard) and "what happens next". */
const en = {
    cmpName: 'Compare',
    cmp: { h: ['Three ways to get', 'a site built.'], lead: 'The plan exists because the other two leave you alone after launch.', cols: ['A typical agency', 'A freelancer by the hour', 'A plan with me'], best: 'This one',
      rows: [
        ['Who you talk to', 'An account manager', 'The freelancer, when free', 'The person doing the work'],
        ['What you pay', 'A quote per project', 'Hours, hard to predict', 'One build, then a fixed month'],
        ['Changes after launch', 'A new quote each time', 'A new invoice each time', 'Included: send a request'],
        ['Work in parallel', 'Depends on the team', 'One thing at a time', '2 to 6 requests at once'],
        ['Design, code, brand, marketing', 'Several people', 'Usually one skill', 'All four, one person'],
        ['If you want to stop', 'Contract terms', 'Depends', 'Pause or cancel any month'],
        ['Code and accounts', 'Ask first', 'Ask first', 'Yours from day one'],
      ], foot: 'Agencies and freelancers vary; this is the usual case, not every case.' },
    appName: 'Dashboard',
    app: { h: ['Your studio,', 'in one tab.'], lead: 'Every plan comes with your own dashboard. Send a request in a minute, watch it move, approve it, and see what the month delivered.', demo: 'Try the live demo', note: 'No account needed', alt: 'The client dashboard',
      tabs: [['Overview', 'What is moving now, what waits for you, what was delivered.', 'overview'], ['Requests', 'Your queue as a board. Drag to choose what starts next.', 'board'], ['Calendar', 'Deadlines, expected deliveries and what repeats.', 'calendar'], ['Plan', 'Upgrade, pause or cancel in three steps, price first.', 'plan']] },
    next: { h: 'What happens next', steps: [['Pick a plan', 'Two minutes, online.'], ['A 20-minute call', 'I learn the business and what to build first.'], ['Your first request on the board', 'Usually within 48 hours.']] },
}
const es: typeof en = {
    cmpName: 'Comparar',
    cmp: { h: ['Tres formas de hacer', 'un sitio.'], lead: 'El plan existe porque las otras dos te dejan solo después del lanzamiento.', cols: ['Una agencia típica', 'Un freelancer por hora', 'Un plan conmigo'], best: 'Este',
      rows: [
        ['Con quién hablas', 'Un ejecutivo de cuentas', 'El freelancer, cuando puede', 'Quien hace el trabajo'],
        ['Qué pagas', 'Un presupuesto por proyecto', 'Horas, difícil de prever', 'Un desarrollo y un mes fijo'],
        ['Cambios después de lanzar', 'Un presupuesto nuevo cada vez', 'Una factura nueva cada vez', 'Incluidos: mandas un pedido'],
        ['Trabajo en paralelo', 'Depende del equipo', 'Una cosa a la vez', 'De 2 a 6 pedidos a la vez'],
        ['Diseño, código, marca, marketing', 'Varias personas', 'Normalmente una sola habilidad', 'Las cuatro, una persona'],
        ['Si quieres parar', 'Según el contrato', 'Depende', 'Pausas o cancelas cualquier mes'],
        ['Código y cuentas', 'Hay que pedirlos', 'Hay que pedirlos', 'Tuyos desde el primer día'],
      ], foot: 'Las agencias y los freelancers varían; este es el caso habitual, no todos los casos.' },
    appName: 'Tu panel',
    app: { h: ['Tu estudio,', 'en una pestaña.'], lead: 'Cada plan viene con tu propio panel. Mandas un pedido en un minuto, lo ves avanzar, lo apruebas y ves lo que entregó el mes.', demo: 'Probar la demo en vivo', note: 'Sin crear cuenta', alt: 'El panel del cliente',
      tabs: [['Resumen', 'Qué se está moviendo, qué espera por ti y qué se entregó.', 'overview'], ['Pedidos', 'Tu cola en un tablero. Arrastras para elegir qué arranca.', 'board'], ['Calendario', 'Fechas límite, entregas estimadas y lo que se repite.', 'calendar'], ['Plan', 'Subes, pausas o cancelas en tres pasos, con el precio antes.', 'plan']] },
    next: { h: 'Qué pasa después', steps: [['Eliges un plan', 'Dos minutos, online.'], ['Una llamada de 20 minutos', 'Conozco el negocio y qué construir primero.'], ['Tu primer pedido en el tablero', 'Normalmente en 48 horas.']] },
}
export const blocks = { en, es }
