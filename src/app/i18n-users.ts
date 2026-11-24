/** Copy for account management (Studio → People) and the sign-in form, now that the studio creates every account. */
const en = {
  tab: 'People',
  title: 'People', sub: 'Every account is created here. Share the username and password with the person yourself.',
  add: 'Add a person', name: 'Full name', username: 'Username', usernameHint: '3 to 32 letters, numbers, dots or dashes', email: 'Email (optional)', emailHint: 'For notices by email. Without it, notices stay in the app.',
  password: 'Password', generate: 'Generate', copy: 'Copy', copied: 'Copied', role: 'Role', client: 'Client', admin: 'Studio (admin)', company: 'Company', plan: 'Requests at a time', noPlan: 'Not active yet', lang: 'Language',
  create: 'Create account', created: (u: string) => `Account ${u} created. Send the username and password to the person.`,
  search: 'Search people', all: 'Everyone', clients: 'Clients', studio: 'Studio', off: 'Switched off',
  cols: { who: 'Person', login: 'Sign-in', role: 'Role', plan: 'Capacity', last: 'Last seen', open: 'Open' },
  never: 'Never', you: 'you', member: (a: string) => `Team of ${a}`,
  reset: 'New password', resetTitle: (n: string) => `New password for ${n}`, resetHint: 'Every device of this person is signed out.', save: 'Save', saved: 'Saved', cancel: 'Cancel',
  disable: 'Switch off', enable: 'Switch on', disabled: 'Account switched off', enabled: 'Account switched on',
  remove: 'Delete', removeAsk: (n: string) => `Delete ${n}? Their requests, files and history are deleted too. This cannot be undone. To keep them, switch the account off instead.`, removed: 'Account deleted',
  empty: 'No one matches.', loadError: 'Couldn’t load the accounts.', retry: 'Try again',
  // sign in
  login: 'Email or username', noAccount: 'No account yet? Federico creates your access and sends it to you.', contact: 'Write to him',
}
const es: typeof en = {
  tab: 'Personas',
  title: 'Personas', sub: 'Cada cuenta se crea acá. Pásale tú el usuario y la contraseña a la persona.',
  add: 'Agregar una persona', name: 'Nombre completo', username: 'Usuario', usernameHint: 'De 3 a 32 letras, números, puntos o guiones', email: 'Email (opcional)', emailHint: 'Para los avisos por email. Sin email, los avisos quedan en el panel.',
  password: 'Contraseña', generate: 'Generar', copy: 'Copiar', copied: 'Copiado', role: 'Rol', client: 'Cliente', admin: 'Estudio (admin)', company: 'Empresa', plan: 'Pedidos a la vez', noPlan: 'Sin activar por ahora', lang: 'Idioma',
  create: 'Crear cuenta', created: (u) => `Cuenta ${u} creada. Envíale el usuario y la contraseña a la persona.`,
  search: 'Buscar personas', all: 'Todos', clients: 'Clientes', studio: 'Estudio', off: 'Desactivadas',
  cols: { who: 'Persona', login: 'Acceso', role: 'Rol', plan: 'Capacidad', last: 'Última vez', open: 'Abiertos' },
  never: 'Nunca', you: 'tú', member: (a) => `Equipo de ${a}`,
  reset: 'Nueva contraseña', resetTitle: (n) => `Nueva contraseña para ${n}`, resetHint: 'Se cierra la sesión en todos sus dispositivos.', save: 'Guardar', saved: 'Guardado', cancel: 'Cancelar',
  disable: 'Desactivar', enable: 'Activar', disabled: 'Cuenta desactivada', enabled: 'Cuenta activada',
  remove: 'Eliminar', removeAsk: (n) => `¿Eliminar a ${n}? También se borran sus pedidos, archivos e historial. No se puede deshacer. Para conservarlos, desactiva la cuenta.`, removed: 'Cuenta eliminada',
  empty: 'Nadie coincide.', loadError: 'No se pudieron cargar las cuentas.', retry: 'Reintentar',
  login: 'Email o usuario', noAccount: '¿Todavía no tienes cuenta? Federico crea tu acceso y te lo envía.', contact: 'Escríbele',
}
export const usersText = { en, es }
