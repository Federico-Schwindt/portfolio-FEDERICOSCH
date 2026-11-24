/** The welcome conversation (first open of the dashboard), in Federico's voice. */
const en = {
  hi: (n: string) => (n ? `Hi ${n}, I’m Federico.` : 'Hi, I’m Federico.'),
  intro: 'Nine short questions about your business. I’ll use your answers when I work on your requests. You can stop and pick up where you left off.',
  start: 'Let’s start', later: 'Do it later', resume: 'Pick up where you left off',
  next: 'OK', skip: 'Skip', back: 'Back', enter: 'press Enter', shiftEnter: 'Shift + Enter for a new line', pick: 'Pick one', pickMany: 'Pick up to two', key: 'Key',
  of: (a: number, b: number) => `${a} of ${b}`, saving: 'Saving…', saveError: 'Couldn’t save that. Check the connection and try again.', close: 'Close and continue later',
  q: {
    name: { t: 'What is your business called?', h: 'The name your customers know.', ph: 'Café La Virginia' },
    what: { t: (n: string) => `What does ${n || 'it'} do, in one or two sentences?`, h: 'Say it like you would to a friend.', ph: 'We roast coffee and sell it online and in two shops.' },
    industry: { t: 'Which of these is closest?', o: ['Shop or ecommerce', 'Food and restaurants', 'Health and wellness', 'Professional services', 'Real estate', 'Education', 'Tech or software', 'Something else'] },
    customers: { t: 'Who buys from you?', h: 'Age, place, what they care about. Rough is fine.', ph: 'People 25 to 45 in Buenos Aires who care about good coffee.' },
    goal: { t: 'What should the next three months get you?', o: ['More sales', 'More leads or bookings', 'Look more professional', 'Launch something new', 'Save time with automation'] },
    links: { t: 'Where can I see you online?', h: 'Paste what you have. Leave the rest empty.', site: 'Website', ig: 'Instagram', other: 'Anything else (store, Google Maps, LinkedIn)' },
    style: { t: 'Which of these feels like you?', o: [['Clean and minimal', 'White space, calm, precise'], ['Bold and loud', 'Big type, strong colour'], ['Warm and friendly', 'Soft, human, approachable'], ['Premium', 'Quiet, elegant, expensive'], ['Playful', 'Colourful, fun, a bit odd']] as [string, string][], colors: 'Brand colours, if you have them', addColor: 'Add a colour' },
    files: { t: 'Drop in what you already have.', h: 'Logo, photos of the place or the products, menus, price lists, old designs. Up to 8 MB each.', logo: 'Logo', rest: 'Photos and documents', drop: 'Drop files here or choose them', dropLogo: 'Drop your logo or choose it', uploading: 'Uploading…', tooBig: (n: string) => `${n} is over 8 MB.`, failed: (n: string) => `Couldn’t upload ${n}.`, remove: 'Remove', none: 'Nothing yet. You can add files later from Files.' },
    notes: { t: 'Anything I should know or avoid?', h: 'Colours you hate, a competitor you admire, a deadline.', ph: 'No green. We open the second shop in March.' },
  },
  done: { t: (n: string) => (n ? `That’s everything, ${n}.` : 'That’s everything.'), sub: 'I have what I need to start. Send your first request and it joins the queue.', first: 'Send my first request', dash: 'Go to my dashboard', sum: 'What you told me' },
  card: { title: 'Tell me about your business', sub: 'Two minutes now saves a week of back and forth.', go: 'Start', cont: 'Continue', left: (n: number) => `${n} question${n === 1 ? '' : 's'} left`, edit: 'Edit my answers', done: 'Business details complete' },
}
const es: typeof en = {
  hi: (n) => (n ? `Hola ${n}, soy Federico.` : 'Hola, soy Federico.'),
  intro: 'Nueve preguntas cortas sobre tu negocio. Usaré tus respuestas cuando trabaje en tus pedidos. Puedes parar y seguir donde lo dejaste.',
  start: 'Empecemos', later: 'Después', resume: 'Seguir donde lo dejaste',
  next: 'OK', skip: 'Saltar', back: 'Atrás', enter: 'presiona Enter', shiftEnter: 'Shift + Enter para otra línea', pick: 'Elige una', pickMany: 'Elige hasta dos', key: 'Tecla',
  of: (a, b) => `${a} de ${b}`, saving: 'Guardando…', saveError: 'No se pudo guardar. Revisa la conexión e inténtalo de nuevo.', close: 'Cerrar y seguir después',
  q: {
    name: { t: '¿Cómo se llama tu negocio?', h: 'El nombre que conocen tus clientes.', ph: 'Café La Virginia' },
    what: { t: (n) => `¿Qué hace ${n || 'tu negocio'}, en una o dos frases?`, h: 'Dilo como se lo dirías a un amigo.', ph: 'Tostamos café y lo vendemos online y en dos locales.' },
    industry: { t: '¿Cuál se parece más?', o: ['Tienda o ecommerce', 'Gastronomía', 'Salud y bienestar', 'Servicios profesionales', 'Inmobiliaria', 'Educación', 'Tecnología o software', 'Otra cosa'] },
    customers: { t: '¿Quién te compra?', h: 'Edad, lugar, qué les importa. A grandes rasgos alcanza.', ph: 'Gente de 25 a 45 en Buenos Aires a la que le importa el buen café.' },
    goal: { t: '¿Qué te tienen que dejar los próximos tres meses?', o: ['Más ventas', 'Más consultas o reservas', 'Verme más profesional', 'Lanzar algo nuevo', 'Ahorrar tiempo automatizando'] },
    links: { t: '¿Dónde te puedo ver online?', h: 'Pega lo que tengas. Lo demás, vacío.', site: 'Sitio web', ig: 'Instagram', other: 'Algo más (tienda, Google Maps, LinkedIn)' },
    style: { t: '¿Cuál se siente como tú?', o: [['Limpio y minimalista', 'Aire, calma, precisión'], ['Fuerte y llamativo', 'Tipografía grande, color intenso'], ['Cálido y cercano', 'Suave, humano, accesible'], ['Premium', 'Sobrio, elegante, caro'], ['Divertido', 'Colorido, juguetón, distinto']], colors: 'Colores de marca, si los tienes', addColor: 'Agregar un color' },
    files: { t: 'Suelta acá lo que ya tengas.', h: 'Logo, fotos del local o de los productos, menús, listas de precios, diseños viejos. Hasta 8 MB cada uno.', logo: 'Logo', rest: 'Fotos y documentos', drop: 'Suelta archivos acá o elígelos', dropLogo: 'Suelta tu logo o elígelo', uploading: 'Subiendo…', tooBig: (n) => `${n} pesa más de 8 MB.`, failed: (n) => `No se pudo subir ${n}.`, remove: 'Quitar', none: 'Todavía nada. Puedes sumar archivos después desde Archivos.' },
    notes: { t: '¿Algo que deba saber o evitar?', h: 'Colores que odias, un competidor que admiras, una fecha límite.', ph: 'Nada de verde. Abrimos el segundo local en marzo.' },
  },
  done: { t: (n) => (n ? `Eso es todo, ${n}.` : 'Eso es todo.'), sub: 'Tengo lo que necesito para arrancar. Manda tu primer pedido y entra a la cola.', first: 'Mandar mi primer pedido', dash: 'Ir a mi panel', sum: 'Lo que me contaste' },
  card: { title: 'Cuéntame de tu negocio', sub: 'Dos minutos ahora ahorran una semana de idas y vueltas.', go: 'Empezar', cont: 'Continuar', left: (n) => `Falta${n === 1 ? '' : 'n'} ${n} pregunta${n === 1 ? '' : 's'}`, edit: 'Editar mis respuestas', done: 'Datos del negocio completos' },
}
export const welcome = { en, es }
export type W = typeof en
