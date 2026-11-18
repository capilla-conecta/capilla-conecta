/* ============================================================
   CAPILLA CONECTA - APP.JS
   Versión Final: Auth, Comercios, Chat y Tablón Completo.
   ============================================================ */

// ===== DATOS ESTÁTICOS =====
const BARRIOS_CAPILLA = [
  { id: 'centro', name: 'Centro', description: 'Casco histórico, calle techada y comercio local', icon: '🏛️' },
  { id: 'aguas-azules', name: 'Aguas Azules', description: 'Zona residencial serena camino al balneario', icon: '💧' },
  { id: 'balumba', name: 'Balumba', description: 'Tranquilidad serrana, vegetación y vistas al cerro', icon: '🌲' },
  { id: 'el-zapato', name: 'El Zapato', description: 'Mirador icónico y geoforma natural de Capilla', icon: '🪨' },
  { id: 'el-zapato-norte', name: 'El Zapato Norte', description: 'Sector norte lindante a los senderos serranos', icon: '🧭' },
  { id: 'faldas-del-uritorco', name: 'Faldas del Uritorco', description: 'Al pie del mítico cerro, naturaleza pura', icon: '⛰️' },
  { id: 'la-atalaya', name: 'La Atalaya', description: 'Miradores altos con vistas panorámicas al valle', icon: '🔭' },
  { id: 'la-banda', name: 'La Banda', description: 'Cercano a las márgenes del río y arboledas', icon: '🌊' },
  { id: 'la-toma', name: 'La Toma', description: 'Balneario natural de ollas de agua cristalina', icon: '🏞️' },
  { id: 'las-flores', name: 'Las Flores', description: 'Barrio floral y apacible de familias del pueblo', icon: '🌸' },
  { id: 'las-gemelas', name: 'Las Gemelas', description: 'Sector cercano a los cerros Las Gemelas', icon: '🌄' },
  { id: 'san-martin', name: 'San Martín', description: 'Barrio tradicional, vecinal y cercano al centro', icon: '🏡' },
  { id: 'valenti', name: 'Valenti', description: 'Cercano al Dique El Cajón y vertientes naturales', icon: '🌿' },
  { id: 'arpentino', name: 'Arpentino', description: 'Zona tranquila, calles arboladas y espíritu de pueblo', icon: '🍃' },
  { id: 'villa-cielo', name: 'Villa Cielo', description: 'Altos de Capilla con aire puro y vista al Uritorco', icon: '☁️' },
  { id: 'dolores', name: 'Dolores', description: 'Entrada sur histórica a la localidad', icon: '🛤️' },
  { id: 'los-alazanes', name: 'Los Alazanes', description: 'Paso y cuenca hacia el dique Los Alazanes', icon: '🐎' },
  { id: 'parque-cinco-estrellas', name: 'Parque Cinco Estrellas', description: 'Sector residencial abierto y cielo diáfano', icon: '⭐' },
  { id: 'el-cajon', name: 'El Cajón', description: 'Lindero al lago y paredón del Dique El Cajón', icon: '⛵' },
  { id: 'san-esteban', name: 'San Esteban', description: 'Portal vecino de casonas y tranquilidad serrana', icon: '🏘️' },
];
const AVATAR_OPTIONS = ['😀','😎','🐱','🐶','🌲','⛰️','🌞','🌙','⭐','🔥','🦊','🦉','🌻','🍀','🎸','🚴','🧉','🏠','🎨','🚀'];

// ===== CONSTANTES DE TIEMPO =====
const VIDA_ANUNCIO_MS = 72 * 60 * 60 * 1000;
const EDICION_MS = 10 * 60 * 1000;

// ===== ESTADO GLOBAL =====
let currentUser = null;
let isDarkMode = false;
let deferredPrompt = null;
let allPosts = [];
let selectedAvatar = '⛰️';
let selectedProfileAvatar = '⛰️';
let currentProfileTarget = null;

const activeTimers = new Map();
let unsubComments = new Map();
let unsubNotifications = null;
let unsubChat = null;
let unsubPosts = null;
let unsubUnread = [];
let unreadCounters = {};

// ===== UTILIDADES =====
function getFormattedUserName(user) {
  const name = (user.displayName || user.email?.split('@')[0] || 'Vecino').trim();
  const barrio = BARRIOS_CAPILLA.find(b => b.id === user.neighborhoodId);
  return `${name} (${barrio ? barrio.name : user.neighborhoodId})`;
}
function getBarrio(id) { return BARRIOS_CAPILLA.find(b => b.id === id); }
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ===== LOCALSTORAGE Y DATOS DEMO =====
const STORAGE_KEY = 'capilla_local_db_v1';
const THEME_KEY = 'capilla_theme';
const USER_KEY = 'capilla_user';

function getLocalDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  const initial = { users: getDefaultUsers(), posts: [], messages: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}
function saveLocalDB(db) { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }

function getDefaultUsers() {
  return [
    { id: 'usr_admin', email: 'admin@capilladelmonte.gov.ar', displayName: 'Coordinación Vecinal', neighborhoodId: 'centro', avatarEmoji: '⛰️', phone: '+54 3548 481234', phoneVisible: true, bio: 'Canal oficial.', role: 'admin', emailVerified: true, rulesAccepted: true, lastNeighborhoodChange: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), isBanned: false, createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString() },
    { id: 'usr_maria', email: 'maria.balumba@gmail.com', displayName: 'María Serrana', neighborhoodId: 'balumba', avatarEmoji: '🌻', phone: '+54 3548 554321', phoneVisible: true, bio: 'Vecina de Balumba.', role: 'user', emailVerified: true, rulesAccepted: true, lastNeighborhoodChange: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(), isBanned: false, createdAt: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString() },
    { id: 'usr_carlos', email: 'carlos.carpintero@hotmail.com', displayName: 'Carlos Tallador', neighborhoodId: 'el-zapato', avatarEmoji: '🌲', phone: '+54 3548 612890', phoneVisible: true, bio: 'Carpintería rústica.', role: 'user', emailVerified: true, rulesAccepted: true, lastNeighborhoodChange: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(), isBanned: false, createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString() },
    { id: 'usr_luna', email: 'luna.uritorco@yahoo.com.ar', displayName: 'Luna Sendas', neighborhoodId: 'faldas-del-uritorco', avatarEmoji: '⭐', phone: '+54 3548 778899', phoneVisible: false, bio: 'Amante de las sierras.', role: 'user', emailVerified: true, rulesAccepted: true, lastNeighborhoodChange: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(), isBanned: false, createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString() },
  ];
}

// ===== TEMA =====
function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  isDarkMode = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme();
}
function applyTheme() {
  document.documentElement.classList.toggle('dark', isDarkMode);
  localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = isDarkMode ? '☀️' : '🌙';
}
function toggleDarkMode() { isDarkMode = !isDarkMode; applyTheme(); }

// ===== VIEWPORT =====
function initViewportHeight() {
  const update = () => {
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
  };
  update();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
  }
  window.addEventListener('resize', update);
}

// ===== AUTH =====
function switchAuthTab(tab) {
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('auth-error').classList.add('hidden');
}

let registerMode = 'guest'; // 'guest' o 'email'

function switchRegisterMode(mode) {
  registerMode = mode;
  const btnGuest = document.getElementById('btn-mode-guest');
  const btnEmail = document.getElementById('btn-mode-email');
  const emailFields = document.getElementById('email-fields');
  const warning = document.getElementById('guest-warning');
  const emailInput = document.getElementById('reg-email');

  if (!btnGuest || !btnEmail) return;

  if (mode === 'guest') {
    btnGuest.className = 'btn btn-teal btn-sm';
    btnEmail.className = 'btn btn-outline btn-sm';
    emailFields.classList.add('hidden');
    warning.classList.remove('hidden');
    emailInput.required = false;
  } else {
    btnGuest.className = 'btn btn-outline btn-sm';
    btnEmail.className = 'btn btn-teal btn-sm';
    emailFields.classList.remove('hidden');
    warning.classList.add('hidden');
    emailInput.required = true;
  }
}
function buildNeighborhoodSelect(selectId, currentId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  
  let html = `<option value="" disabled ${!currentId ? 'selected' : ''}>📍 Seleccioná tu barrio...</option>`;
  html += BARRIOS_CAPILLA.map(b => `<option value="${b.id}" ${b.id === currentId ? 'selected' : ''}>${b.icon} ${b.name}</option>`).join('');
  sel.innerHTML = html;
}
function buildAvatarGrid(gridId, selected, onSelect) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = AVATAR_OPTIONS.map(emoji => `<button type="button" class="avatar-option ${emoji === selected ? 'selected' : ''}" data-emoji="${emoji}" title="${emoji}">${emoji}</button>`).join('');
  grid.querySelectorAll('.avatar-option').forEach(btn => {
    btn.onclick = () => {
      grid.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect(btn.dataset.emoji);
    };
  });
}
function updatePreviewName() {
  const nameEl = document.getElementById('reg-name');
  const emailEl = document.getElementById('reg-email');
  const barrioEl = document.getElementById('reg-neighborhood');
  const previewEl = document.getElementById('preview-name-text');
  
  if (!nameEl || !previewEl) return;

  const email = emailEl ? emailEl.value : '';
  const name = nameEl.value;
  const barrioId = barrioEl ? barrioEl.value : 'centro';
  
  const displayName = name.trim() || (email ? email.split('@')[0] : 'Tu Nombre');
  
  previewEl.textContent = `${selectedAvatar} ${getFormattedUserName({ displayName, email, neighborhoodId: barrioId })}`;
}

async function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('auth-error'); errEl.classList.add('hidden');
  
  const displayName = document.getElementById('reg-name').value.trim();
  const neighborhoodId = document.getElementById('reg-neighborhood').value;
  const rulesAccepted = document.getElementById('reg-rules').checked;
  const password = document.getElementById('reg-password') ? document.getElementById('reg-password').value : '';
  
  if (!displayName) { showAuthError('Ingresá tu nombre o apodo.'); return; }
  if (!neighborhoodId || neighborhoodId === '') { 
    showAuthError('Por favor, seleccioná tu barrio. Es obligatorio para entrar.'); 
    document.getElementById('reg-neighborhood').focus();
    return; 
  }
  if (!rulesAccepted) { showAuthError('Debés aceptar las normas de convivencia.'); return; }

  let email = '';
  let isVerified = false;
  let points = 0;

  if (registerMode === 'email') {
    email = document.getElementById('reg-email').value.trim().toLowerCase();
    if (!email) { showAuthError('Ingresá tu correo electrónico.'); return; }
    if (!password || password.length < 6) { showAuthError('La contraseña debe tener al menos 6 caracteres.'); return; }
    
    const dominiosValidos = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'icloud.com', 'yahoo.com.ar', 'hotmail.com.ar', 'outlook.com.ar'];
    const partesEmail = email.split('@');
    const dominio = partesEmail.length === 2 ? partesEmail[1] : '';
    if (!dominiosValidos.includes(dominio)) {
      showAuthError('Usá un correo real (Gmail, Hotmail, Yahoo, Outlook, iCloud).');
      return;
    }
    isVerified = false;
  }

  try {
    let firebaseUser = null;
    
    if (registerMode === 'email') {
      const userCredential = await window.Firebase.createUserWithEmailAndPassword(window.Firebase.auth, email, password);
      firebaseUser = userCredential.user;
      
      // 👇 GUARDAMOS LOS DATOS EN MEMORIA CON EL BARRIO REAL QUE ELIGIÓ EL USUARIO 👇
      window.__pendingProfileData = {
        uid: firebaseUser.uid,
        email: email,
        displayName: displayName,
        neighborhoodId: neighborhoodId, // <-- Toma lo que el usuario eligió (ej: Valenti, Balumba, etc.)
        avatarEmoji: selectedAvatar,
        bio: '',
        role: 'user',
        emailVerified: false,
        points: points,
        rulesAccepted: true,
        createdAt: new Date().toISOString()
      };
      
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: false
      };
      await window.Firebase.sendEmailVerification(firebaseUser, actionCodeSettings);
      console.log("✅ Correo de verificación enviado a:", email);
      
    } else {
      const anonEmail = `invitado_${Date.now()}@capillaconecta.local`;
      const anonPass = 'invitado123456';
      const userCredential = await window.Firebase.createUserWithEmailAndPassword(window.Firebase.auth, anonEmail, anonPass);
      firebaseUser = userCredential.user;
      email = anonEmail;
      isVerified = false;
      
      window.__pendingProfileData = {
        uid: firebaseUser.uid,
        email: email,
        displayName: displayName,
        neighborhoodId: neighborhoodId, // <-- Toma lo que el usuario eligió
        avatarEmoji: selectedAvatar,
        bio: '',
        role: 'user',
        emailVerified: false,
        points: points,
        rulesAccepted: true,
        createdAt: new Date().toISOString()
      };
    }

    if (registerMode === 'email') {
      await window.Firebase.signOut(window.Firebase.auth); 
      showAuthError('¡Cuenta creada! Revisá tu correo (y la carpeta de spam) para verificar tu cuenta y poder entrar.');
      
      document.getElementById('reg-name').value = '';
      document.getElementById('reg-email').value = '';
      document.getElementById('reg-password').value = '';
      switchAuthTab('login');
      return;
    }

    // Si es invitado, el onAuthStateChanged se encarga de guardar el perfil.

  } catch (error) {
    console.error("ERROR:", error);
    
    if (error.code === 'auth/email-already-in-use') {
      showAuthError('Ese correo ya está registrado. Iniciá sesión.');
    } else {
      showAuthError('Error al crear la cuenta. Intentá de nuevo.');
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('auth-error'); errEl.classList.add('hidden');
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password') ? document.getElementById('login-password').value : '';

  if (!email || !password) { showAuthError('Ingresá tu correo y contraseña.'); return; }

  try {
    const userCredential = await window.Firebase.signInWithEmailAndPassword(window.Firebase.auth, email, password);

    // 👇 FORZAMOS LA RECARGA DEL USUARIO PARA VER EL ESTADO REAL 👇
    await userCredential.user.reload();
    // 👆 FIN DE LA RECARGA 👆

    if (!userCredential.user.emailVerified) {
      showAuthError('Tenés que verificar tu correo. Revisá tu bandeja de entrada (y la carpeta de spam).');
      await window.Firebase.signOut(window.Firebase.auth);
      return;
    }

    await loginUser(userCredential.user.uid);
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      showAuthError('Correo o contraseña incorrectos.');
    } else {
      showAuthError('Error al iniciar sesión. Intentá de nuevo.');
    }
  }
}

function showAuthError(msg) { const el = document.getElementById('auth-error'); el.textContent = msg; el.classList.remove('hidden'); }

// 👇 PEGÁ LA FUNCIÓN ACÁ 👇
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const svgOjoAbierto = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  
  const svgOjoCerrado = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = svgOjoCerrado; // Se muestra el ojo tachado (contraseña visible)
  } else {
    input.type = 'password';
    btn.innerHTML = svgOjoAbierto; // Se muestra el ojo abierto (contraseña oculta)
  }
}

async function loginUser(uid) {
  if (!window.Firebase) return;
  const { db, ref, get, set, update } = window.Firebase;
  
  try {
    // 👇 ESPERAMOS 1 SEGUNDO ANTES DE LEER (para que Firebase actualice el token) 👇
    await new Promise(r => setTimeout(r, 1000));
    
    let snap = await get(ref(db, 'perfiles/' + uid));
    
    // Si no existe, esperamos 2 segundos más y reintentamos
    if (!snap.exists()) {
      await new Promise(r => setTimeout(r, 2000));
      snap = await get(ref(db, 'perfiles/' + uid));
    }

    // 👇 SI NO EXISTE, LO CREAMOS CON LOS DATOS QUE GUARDAMOS EN EL REGISTRO 👇
    if (!snap.exists()) {
      const authUser = window.Firebase.auth.currentUser;
      let nombreTemporal = 'Vecino';
      let barrioTemporal = 'centro';
      let avatarTemporal = '⛰️';

      if (authUser) {
        // Buscamos los datos que guardamos en localStorage al registrarnos
        const pendingData = localStorage.getItem('pending_profile_' + authUser.uid);
        if (pendingData) {
          try {
            const parsed = JSON.parse(pendingData);
            nombreTemporal = parsed.displayName;
            barrioTemporal = parsed.neighborhoodId;
            avatarTemporal = parsed.avatarEmoji;
            localStorage.removeItem('pending_profile_' + authUser.uid);
          } catch(e) {}
        } else {
          nombreTemporal = authUser.displayName || authUser.email.split('@')[0];
        }
      }

      await set(ref(db, 'perfiles/' + uid), {
        uid: uid,
        email: authUser ? authUser.email : '',
        displayName: nombreTemporal,
        neighborhoodId: barrioTemporal,
        avatarEmoji: avatarTemporal,
        role: 'user',
        emailVerified: true,
        points: 0,
        createdAt: new Date().toISOString()
      });
      
      snap = await get(ref(db, 'perfiles/' + uid));
    }

    if (!snap.exists()) {
      alert('Hubo un problema grave al crear tu perfil. Contactá al administrador.');
      await window.Firebase.signOut(window.Firebase.auth);
      window.location.reload(); 
      return;
    }
    
    const user = { ...snap.val(), id: uid }; 

        // 👇 VERIFICAMOS CON EL ESTADO REAL DE FIREBASE AUTH 👇
    const esInvitado = user.email && user.email.includes('@capillaconecta.local');
    const authUser = window.Firebase.auth.currentUser;
    
    if (!esInvitado && authUser && !authUser.emailVerified) {
      alert('🚫 Tenés que verificar tu correo electrónico antes de entrar.\n\nRevisá tu bandeja de entrada o la carpeta de spam.');
      await window.Firebase.signOut(window.Firebase.auth);
      document.getElementById('auth-modal').classList.remove('hidden');
      document.getElementById('main-header').classList.add('hidden');
      document.getElementById('main-content').classList.add('hidden');
      return; 
    }
    // 👆 FIN DE LA VALIDACIÓN 👆

    if (user.isBanned) {
      if (user.banExpires && Date.now() < user.banExpires) {
        const dias = Math.ceil((user.banExpires - Date.now()) / (1000 * 60 * 60 * 24));
        alert(`🚫 BLOQUEADO. Te quedan ${dias} días.`);
        return;
      } else if (user.banExpires) {
        await update(ref(db, 'perfiles/' + uid), { isBanned: false, banExpires: null });
      } else {
        alert('🚫 BLOQUEADO PERMANENTEMENTE.');
        return;
      }
    }

    currentUser = user;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    updateUserUI();
    selectTab('tablon');
    setTimeout(() => listenMyNotifications(), 800);
    setTimeout(() => listenUnreadMessages(), 500);
    const fab = document.getElementById('fab-invite'); if (fab) fab.classList.toggle('hidden', !currentUser);
    escucharPuntosUsuario(user.id);

    activarNotificacionesPush();

  } catch (e) {
    console.error(e);
    alert('Error al cargar el perfil.');
  }
}

async function activarNotificacionesPush() {
  if (!window.Firebase || !currentUser) return;
  const avisoVisto = localStorage.getItem('notif_aviso_visto');
  if (!avisoVisto) {
    document.getElementById('notif-warning-modal').classList.remove('hidden');
    localStorage.setItem('notif_aviso_visto', 'true');
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await window.Firebase.getToken(window.Firebase.messaging, {
        vapidKey: 'BJiNXbRRP0tRauQq0kcAl_DquhjpxMg8ZEs99NHIqM9zLCCoY40QK7QWjsYiheEi3_6TdSjt_ugQGJM8ma9pqAU' // La generás en Firebase > Cloud Messaging > Web Push certificates
      });
      console.log('Token FCM:', token);
      const { db, ref, update } = window.Firebase;
      await update(ref(db, 'perfiles/' + currentUser.id), { fcmToken: token });
    }
  } catch (e) {
    console.error('Error al activar notificaciones:', e);
  }
}

// ===== SISTEMA DE REPUTACIÓN Y VOTOS =====
async function actualizarPuntosFirebase(userId, cantidad) {
  if (!window.Firebase) return;
  const { db, ref, runTransaction } = window.Firebase;
  const puntosRef = ref(db, `perfiles/${userId}/puntos`);
  
  try {
    await runTransaction(puntosRef, (puntosActuales) => {
      return (puntosActuales || 0) + cantidad;
    });
  } catch (e) { console.error('Error al actualizar puntos', e); }
}
async function toggleVotoVecino() {
  if (!window.Firebase || !currentUser || !currentProfileTarget) return;
  const targetUserId = currentProfileTarget;
  
  if (targetUserId === currentUser.id) return showToast('No podés votarte a vos mismo 😉');

  const votoKey = `voto_hecho_${currentUser.id}_a_${targetUserId}`;
  const yaVoto = localStorage.getItem(votoKey) === 'true';
  
  const { db, ref, set, remove } = window.Firebase;
  const votoRef = ref(db, `votos/${targetUserId}/${currentUser.id}`);

  if (yaVoto) {
    await remove(votoRef);
    await actualizarPuntosFirebase(targetUserId, -1);
    localStorage.removeItem(votoKey);
    showToast('Le quitaste tu voto');
  } else {
    await set(votoRef, true);
    await actualizarPuntosFirebase(targetUserId, 1);
    localStorage.setItem(votoKey, 'true');
    showToast('¡Voto enviado! ⭐');
  }
  
  openPublicProfile(targetUserId);
}
function escucharPuntosUsuario(userId) {
  if (!window.Firebase) return;
  const { db, ref, onValue } = window.Firebase;
  const puntosRef = ref(db, `perfiles/${userId}/puntos`);
  
  onValue(puntosRef, (snapshot) => {
    const puntos = snapshot.val() || 0;
    if (currentUser && currentUser.id === userId) {
      currentUser.points = puntos;
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      const el = document.getElementById('user-points-display');
      if (el) el.textContent = puntos;
    }
  });
}

async function handleLogout() {
  if (!confirm('¿Cerrar sesión en este dispositivo?')) return;
   if (window.Firebase && window.Firebase.signOut) {
    try {
      await window.Firebase.signOut(window.Firebase.auth);
    } catch(e) { console.error("Error al cerrar sesión en Firebase", e); }
  }
  if (unsubNotifications) { try { unsubNotifications(); } catch(e){} unsubNotifications = null; }
  if (unsubChat) { try { unsubChat(); } catch(e){} unsubChat = null; }
  if (unsubPosts) { try { unsubPosts(); } catch(e){} unsubPosts = null; }
  unsubUnread.forEach(fn => { try { fn(); } catch(e){} });
  unsubUnread = [];
  unsubComments.forEach(fn => { try { fn(); } catch(e){} });
  unsubComments.clear();
  activeTimers.forEach(iv => clearInterval(iv));
  activeTimers.clear();

  currentUser = null; localStorage.removeItem(USER_KEY); closeProfileModal();
  document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('main-header').classList.add('hidden');
  document.getElementById('main-content').classList.add('hidden');
  const fab = document.getElementById('fab-invite'); if (fab) fab.classList.add('hidden');
  const mobileAdmin = document.getElementById('mobile-admin'); if (mobileAdmin) mobileAdmin.classList.add('hidden');
  const mobileComercios = document.getElementById('mobile-comercios'); if (mobileComercios) mobileComercios.classList.remove('hidden');
  const navAdmin = document.getElementById('nav-admin'); if (navAdmin) navAdmin.classList.add('hidden');
  const navComercios = document.getElementById('nav-comercios'); if (navComercios) navComercios.classList.add('hidden');
}
function updateUserUI() {
  if (!currentUser) return;
  document.getElementById('user-avatar').textContent = currentUser.avatarEmoji;
  document.getElementById('user-name').textContent = getFormattedUserName(currentUser);
  document.getElementById('user-pill').classList.remove('hidden');
  document.getElementById('notif-btn').classList.remove('hidden');
  document.getElementById('nav-mibarrio').classList.toggle('hidden', false);
  document.getElementById('mobile-mibarrio').classList.toggle('hidden', false);
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'moderator';
  const navAdmin = document.getElementById('nav-admin'); const navComercios = document.getElementById('nav-comercios');
  if (navAdmin && navComercios) { if (isStaff) { navAdmin.classList.remove('hidden'); navComercios.classList.add('hidden'); } else { navAdmin.classList.add('hidden'); navComercios.classList.remove('hidden'); } }
  const mobileAdmin = document.getElementById('mobile-admin'); const mobileComercios = document.getElementById('mobile-comercios');
  if (mobileAdmin && mobileComercios) { if (isStaff) { mobileAdmin.classList.remove('hidden'); mobileComercios.classList.add('hidden'); } else { mobileAdmin.classList.add('hidden'); mobileComercios.classList.remove('hidden'); } }
  const fab = document.getElementById('fab-invite'); if (fab) fab.classList.remove('hidden');
}

// ===== NAVEGACIÓN =====
function selectTab(tab) {
  const detalle = document.getElementById('comercios-detalle'); const main = document.getElementById('main-content');
  if (detalle && main) { detalle.classList.add('hidden'); main.classList.remove('hidden'); }
  const tabParaNav = tab === 'barrio-chat' ? 'barrios' : tab;
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.tab === tabParaNav); });

  const fabFilter = document.getElementById('fab-filter');
  const fabInvite = document.getElementById('fab-invite');
  if (tab === 'tablon') {
    fabFilter.classList.remove('hidden');
    fabInvite.classList.add('fab-tablon');
  } else {
    fabFilter.classList.add('hidden');
    fabInvite.classList.remove('fab-tablon');
  }

  renderView(tab);
}

function renderView(tab) {
  if (tab !== 'tablon') {
    activeTimers.forEach(iv => clearInterval(iv));
    activeTimers.clear();
  }
  const main = document.getElementById('main-content');
  main.classList.toggle('chat-active', tab === 'chat' || tab === 'mibarrio' || tab === 'barrio-chat');
  switch (tab) {
    case 'tablon': main.innerHTML = renderTablon(); break;
    case 'chat': main.innerHTML = renderChat('todos-juntos', 'Sala General'); break;
    case 'mibarrio': {
      if (!currentUser) { main.innerHTML = renderTablon(); break; }
      const b = getBarrio(currentUser.neighborhoodId);
      main.innerHTML = renderChat('barrio-' + currentUser.neighborhoodId, 'Mi Barrio · ' + (b ? b.icon + ' ' + b.name : ''));
      break;
    }
    case 'barrio-chat': {
      const barrioId = window.__pendingBarrioChat;
      if (!barrioId) { main.innerHTML = renderBarrios(); break; }
      const b = getBarrio(barrioId);
      main.innerHTML = renderChat('barrio-' + barrioId, (b ? b.icon + ' ' + b.name : 'Barrio') + ' · Chat');
      window.__pendingBarrioChat = null;
      break;
    }
    case 'barrios': main.innerHTML = renderBarrios(); break;
    case 'comercios': main.innerHTML = renderComercios(); break;
    case 'admin': main.innerHTML = renderAdminPlaceholder(); break;
    default: main.innerHTML = renderTablon();
  }
}

function renderAdminPlaceholder() {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) {
    return `<div class="view-container"><div class="chat-placeholder"><h3>Acceso Denegado 🚫</h3><p>Solo moderadores pueden entrar acá.</p></div></div>`;
  }

  return `
    <div class="view-container">
      <div class="barrios-header" style="background: linear-gradient(135deg, #1e293b, #0f172a); margin-bottom: 1rem;">
        <div class="badge">🛡️ Panel de Control</div>
        <h2>Moderación</h2>
        <p>Herramientas para mantener la paz en Capilla.</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
        <div class="barrio-card">
          <div class="barrio-card-head"><span class="icon">📢</span><div><h3>Anuncios del Tablón</h3></div></div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 1rem;">Revisá y eliminá publicaciones que violen las reglas.</p>
          <button class="btn btn-outline btn-block" onclick="selectTab('tablon'); showToast('Usá el botón de eliminar en cualquier tarjeta.');">Ir al Tablón</button>
        </div>

        <div class="barrio-card">
          <div class="barrio-card-head"><span class="icon">💬</span><div><h3>Historial de Chat</h3></div></div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 1rem;">Entrá a los chats para borrar mensajes ofensivos.</p>
          <button class="btn btn-outline btn-block" onclick="selectTab('chat'); showToast('Entrá al chat y usá el botón 🗑️ en cualquier mensaje.');">Ir al Chat General</button>
        </div>

        <div class="barrio-card">
          <div class="barrio-card-head"><span class="icon">👥</span><div><h3>Usuarios</h3></div></div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 1rem;">Directorio de vecinos para revisar perfiles.</p>
          <button class="btn btn-outline btn-block" onclick="abrirListaVecinosAdmin()">Ver Vecinos</button>
        </div>
                
        <div class="barrio-card">
          <div class="barrio-card-head"><span class="icon">🧹</span><div><h3>Limpieza de Chats</h3></div></div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 1rem;">Borrar mensajes viejos para mantener la base de datos liviana.</p>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button class="btn btn-outline btn-block" onclick="limpiarChatGeneral()">🧹 Limpiar General (+24hs)</button>
            <button class="btn btn-outline btn-block" onclick="limpiarChatsBarrios()">🧹 Limpiar Barrios (+7 días)</button>
          </div>
        </div>
    </div>
    </div>`;

}

async function abrirListaVecinosAdmin() {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) return;
  
  const container = document.getElementById('main-content');
  container.innerHTML = `<div class="view-container"><div class="chat-placeholder"><div class="emoji">👥</div><h3>Cargando vecinos...</h3></div></div>`;
  
  if (!window.Firebase) return;
  const { db, ref, get } = window.Firebase;
  
  try {
    const snap = await get(ref(db, 'perfiles'));
    const users = [];
    if (snap.exists()) {
      snap.forEach(child => {
        users.push({ id: child.key, ...child.val() });
      });
    }
    
    // Ordenamos alfabéticamente
    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    
    let html = `
      <div class="view-container">
        <div class="board-header">
          <div class="board-title">👥 Directorio de Vecinos</div>
          <div class="board-subtitle">Total: ${users.length} vecinos registrados</div>
          <button class="btn btn-outline btn-sm" style="margin-top: 0.5rem;" onclick="selectTab('admin')">← Volver al Panel</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
    `;
    
    users.forEach(u => {
      const isBanned = u.isBanned ? ' 🚫' : '';
      const roleIcon = u.role === 'admin' ? '🛡️' : (u.role === 'moderator' ? '⚖️' : '👤');
      const barrio = getBarrio(u.neighborhoodId);
      
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 0;">
            <span style="font-size: 24px;">${u.avatarEmoji || '⛰️'}</span>
            <div style="min-width: 0;">
              <div style="font-weight: bold; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${roleIcon} ${u.displayName || 'Vecino'}${isBanned}
              </div>
              <div style="font-size: 11px; color: var(--text-muted);">
                📍 ${barrio ? barrio.name : u.neighborhoodId} · ${u.email || 'Sin correo'}
              </div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="openPublicProfile('${u.id}')">Ver Perfil</button>
        </div>
      `;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
    
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="view-container"><div class="chat-placeholder"><h3>Error al cargar vecinos</h3></div></div>`;
  }
}

// ===== CHAT =====
function renderChat(roomId, titulo) {
  const html = `
    <div class="view-container" style="padding: 0; max-width: 800px; height: 100%; display: flex; flex-direction: column;">
      <div class="board-header" style="border-radius: 0; margin-bottom: 0; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); background: var(--bg-card);"><div class="board-title">💬 ${titulo}</div></div>
      <div id="chat-messages" class="whatsapp-bg" style="flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;"><div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 1rem;">Cargando...</div></div>
      <div id="chat-form-container">
        <form id="chat-form" style="display: flex; gap: 0.5rem; padding: 0.75rem; background: var(--bg-card); border-top: 1px solid var(--border-color);"><input type="text" id="chat-input" placeholder="Escribí un mensaje..." autocomplete="off" style="flex: 1; padding: 0.75rem 1rem; border-radius: 999px; border: 1px solid var(--slate-300); background: var(--bg-input); color: var(--text-primary); outline: none;" /><button type="submit" class="btn btn-teal" style="border-radius: 999px; padding: 0.75rem 1.25rem;">Enviar</button></form>
      </div>
    </div>`;
  requestAnimationFrame(() => initFirebaseChat(roomId));
  return html;
}

function initFirebaseChat(roomId) {
  if (!window.Firebase) return showToast('Error: Firebase no configurado');

  if (unsubChat) { try { unsubChat(); } catch(e){} unsubChat = null; }

  let canWrite = true;
  if (roomId.startsWith('barrio-')) {
    const barrioId = roomId.replace('barrio-', '');
    const esAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');
    canWrite = currentUser && (currentUser.neighborhoodId === barrioId || esAdmin);
  }

  if (!canWrite) {
    const formContainer = document.getElementById('chat-form-container');
    if (formContainer) {
      const barrioId = roomId.replace('barrio-', '');
      const b = getBarrio(barrioId);
      formContainer.innerHTML = `<div style="padding: 0.75rem 1rem; background: var(--bg-card); border-top: 1px solid var(--border-color); text-align: center; font-size: 12px; color: var(--text-muted);">🔒 Solo los vecinos de ${b ? b.name : 'este barrio'} pueden escribir acá. Podés leer los mensajes.</div>`;
    }
  }

  const nowRead = Date.now();
  localStorage.setItem('lastRead_' + roomId, nowRead);
  try {
    const { db: dbR, ref: refR, set: setR } = window.Firebase;
    setR(refR(dbR, `users/${currentUser.id}/lastRead/${roomId}`), nowRead);
  } catch(e) {}

  const { db, ref, push, onValue, query, limitToLast, serverTimestamp } = window.Firebase;
  const messagesRef = ref(db, 'chats/' + roomId);
  const messagesQuery = query(messagesRef, limitToLast(50));
  const chatContainer = document.getElementById('chat-messages');

  unsubChat = onValue(messagesQuery, (snapshot) => {
    if (!chatContainer) return;
    chatContainer.innerHTML = '';
    if (!snapshot.exists()) { chatContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 1rem;">No hay mensajes aún.</div>'; return; }

    const miNombre = (currentUser.displayName || currentUser.email.split('@')[0]).toLowerCase().split(' ')[0];

    snapshot.forEach((childSnapshot) => {
      const msg = childSnapshot.val(); const isMine = msg.userId === currentUser.id;
      const msgEl = document.createElement('div');

      const textoLower = (msg.text || '').toLowerCase();
      const mencionado = !isMine && textoLower.includes('@' + miNombre);

      let bgColor = isMine ? '#d9fdd3' : '#ffffff';
      let borderStyle = 'none';
      if (mencionado) {
        bgColor = '#fef3c7';
        borderStyle = '1.5px solid #f59e0b';
      }

      msgEl.style.cssText = `align-self: ${isMine ? 'flex-end' : 'flex-start'}; background: ${bgColor}; color: #111; padding: 0.5rem 0.75rem; border-radius: 12px; border-bottom-${isMine ? 'right' : 'left'}-radius: 2px; max-width: 85%; font-size: 13px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); border: ${borderStyle};`;
      const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
      const nombreChat = `<span onclick="openPublicProfile('${msg.userId}')" style="cursor:pointer; text-decoration: underline; text-decoration-color: #0d9488;">${msg.userName}</span>`;
            const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
      const esStaff = currentUser.role === 'admin' || currentUser.role === 'moderator';
      
      const tiempoMensaje = msg.createdAt || 0;
      const ahora = Date.now();
      const puedeEditar = isMine && (ahora - tiempoMensaje < 3 * 60 * 1000); // 3 minutos
      
      const btnBorrar = (puedeEditar || esStaff) ? `<button onclick="deleteChatMsg('${roomId}', '${childSnapshot.key}')" style="background:none; border:none; cursor:pointer; font-size:12px; color:#dc2626; padding:0 4px;" title="Eliminar mensaje">🗑️</button>` : '';
      
      const btnEditar = puedeEditar ? `<button onclick="openEditChatMsg('${roomId}', '${childSnapshot.key}', \`${(msg.text || '').replace(/`/g, '\\`')}\`)" style="background:none; border:none; cursor:pointer; font-size:12px; color:#0d9488; padding:0 4px;" title="Editar mensaje">✏️</button>` : '';
      
      const editadoTag = msg.edited ? `<span style="font-size: 9px; color: #667781; font-style: italic; margin-left: 4px;">(editado)</span>` : '';
      msgEl.innerHTML = `${!isMine ? `<div style="font-size: 11px; font-weight: 700; color: #0d9488; margin-bottom: 2px;">${nombreChat}</div>` : ''}<div style="word-wrap: break-word;">${msg.text}${editadoTag}</div><div style="font-size: 10px; text-align: right; color: #667781; margin-top: 4px; display: flex; justify-content: flex-end; align-items: center; gap: 4px;">${timeStr} ${btnEditar} ${btnBorrar}</div>`;
      chatContainer.appendChild(msgEl);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (typeof refreshUnreadDots === 'function') {
      unreadCounters[roomId] = 0;
      refreshUnreadDots();
    }
  });

  if (!canWrite) return;

  const form = document.getElementById('chat-form'); const input = document.getElementById('chat-input');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      input.value = '';

      const mentions = [];
      const mentionRegex = /@([a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)/g;
      let match;
      while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1].toLowerCase());
      }

      push(messagesRef, {
        userId: currentUser.id,
        userName: getFormattedUserName(currentUser),
        userAvatar: currentUser.avatarEmoji,
        text: text,
        createdAt: serverTimestamp()
      }).then(() => {
        if (mentions.length > 0) {
          const db2 = window.Firebase.db;
          const notifRef = window.Firebase.ref(db2, 'notifications');
          const dbLocal = getLocalDB();

          mentions.forEach(name => {
            dbLocal.users.forEach(u => {
              const uName = (u.displayName || u.email.split('@')[0]).toLowerCase();
              if (uName === name && u.id !== currentUser.id) {
                window.Firebase.push(notifRef, {
                  userId: u.id,
                  fromName: currentUser.displayName || currentUser.email.split('@')[0],
                  text: text,
                  roomId: roomId,
                  type: 'mention',
                  read: false,
                  createdAt: window.Firebase.serverTimestamp()
                });
              }
            });
          });
        }
      }).catch(() => showToast('Error al enviar.'));
    };
  }
}

// ===== TABLÓN =====
function renderTablon() {
  let html = `
    <div class="view-container">
      <div class="board-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div class="board-title">📋 Tablón Vecinal</div>
            <div class="board-subtitle">Ventas, regalos y oficios · El anuncio dura 72 hs · Editable los primeros 10 min</div>
          </div>
          <button onclick="openCreatePostModal()" class="btn btn-teal btn-sm">+ Publicar Anuncio</button>
        </div>
      </div>
      <div id="posts-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
        <div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 2rem; grid-column: 1 / -1;">Cargando anuncios...</div>
      </div>
    </div>`;
  requestAnimationFrame(() => initFirebasePosts());
  return html;
}

function initFirebasePosts() {
  if (!window.Firebase) return;
  const { db, ref, onValue, query, limitToLast, remove } = window.Firebase;

  if (unsubPosts) { try { unsubPosts(); } catch(e){} unsubPosts = null; }

  const postsRef = ref(db, 'posts');
  const postsQuery = query(postsRef, limitToLast(100));

  unsubPosts = onValue(postsQuery, (snapshot) => {
    allPosts = [];
    const now = Date.now();
    snapshot.forEach(child => {
      const p = { id: child.key, ...child.val() };
      const t = p.timestamp || new Date(p.createdAt).getTime();
      if (now - t > VIDA_ANUNCIO_MS) {
        remove(ref(db, 'posts/' + p.id)).catch(() => {});
      } else {
        allPosts.push(p);
      }
    });
    allPosts.reverse();
    applyFilters();
  });
}

function applyFilters() {
  const text = document.getElementById('filter-text')?.value.toLowerCase() || '';
  const cat = document.getElementById('filter-category')?.value || 'todos';
  const barrio = document.getElementById('filter-barrio')?.value || 'todos';

  const container = document.getElementById('posts-container');
  if (!container) return;

  activeTimers.forEach(iv => clearInterval(iv));
  activeTimers.clear();

  unsubComments.forEach(fn => { try { fn(); } catch(e){} });
  unsubComments.clear();

  container.innerHTML = '';

  const filtered = allPosts.filter(post => {
    const matchText = post.title.toLowerCase().includes(text) || post.description.toLowerCase().includes(text);
    const matchCat = cat === 'todos' || post.category === cat;
    const matchBarrio = barrio === 'todos' || post.neighborhoodId === barrio;
    return matchText && matchCat && matchBarrio;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 2rem; grid-column: 1 / -1;">No se encontraron anuncios con esos filtros.</div>`;
    return;
  }

  let html = '';
  filtered.forEach(post => {
    const time = post.createdAt ? new Date(post.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const isMine = post.userId === currentUser.id;
    const catIcons = { vende: '🛒 Vende', regala: '🎁 Regala', busca: '🔍 Busca', servicio: '🛠️ Servicio' };
    const catLabel = catIcons[post.category] || post.category;
    const likesCount = post.likes ? Object.keys(post.likes).length : 0;
    const hasLiked = post.likes && post.likes[currentUser.id];

    let cintaHtml = '';
    if (post.cinta) {
      const cintasColors = { reservado: 'cinta-reservado', vendido: 'cinta-vendido', urgente: 'cinta-urgente', gratis: 'cinta-gratis' };
      cintaHtml = `<div class="cinta-estado ${cintasColors[post.cinta] || 'cinta-reservado'}">${post.cinta}</div>`;
    }

    const createdAtMs = post.timestamp || new Date(post.createdAt).getTime();
    const ageMs = Date.now() - createdAtMs;

    if (ageMs > VIDA_ANUNCIO_MS) return;

    let timerHtml = '';
    let botonesAutorHtml = '';

    if (isMine && ageMs < EDICION_MS) {
      const timeLeft = EDICION_MS - ageMs;
      const mins = Math.floor(timeLeft / 60000);
      const secs = Math.floor((timeLeft % 60000) / 1000);
      timerHtml = `<div class="timer-box" id="timer-${post.id}">⏱️ ${mins}:${secs < 10 ? '0' : ''}${secs}</div>`;

      const cintasOptions = [
        { value: '', label: 'Sin cinta' },
        { value: 'reservado', label: 'Reservado' },
        { value: 'vendido', label: 'Vendido' },
        { value: 'urgente', label: 'Urgente' },
        { value: 'gratis', label: 'Gratis' }
      ];

      botonesAutorHtml = `
        <div id="cintas-row-${post.id}" style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 4px;">
          <span style="font-size: 10px; color: var(--text-muted); width: 100%;">Etiquetar:</span>
          ${cintasOptions.map(c => `
            <button onclick="setCinta('${post.id}', '${c.value}')"
                    class="btn-cinta ${post.cinta === c.value ? 'active' : ''}">
              ${c.label}
            </button>
          `).join('')}
        </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;" id="autor-btns-${post.id}">
          <button onclick="openEditPostModal('${post.id}')" class="btn btn-outline btn-sm" style="flex: 1;">✏️ Editar</button>
          ${(isMine || currentUser.role === 'admin' || currentUser.role === 'moderator') ? '<button onclick="deletePost(\'' + post.id + '\')" class="btn btn-outline btn-sm" style="flex: 1; color: #dc2626; border-color: #fca5a5;">🗑️ Eliminar</button>' : ''}
        </div>`;

      setTimeout(() => startTimer(post.id, timeLeft), 100);
    }

    const editadoHtml = post.edited ? `<span style="font-size: 10px; color: var(--text-muted); font-style: italic;">✏️ Editado</span>` : '';

    let botonesAdminHtml = '';
    if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
      botonesAdminHtml = `
        <div style="margin-top: 0.5rem; border-top: 1px dashed #fca5a5; padding-top: 0.5rem;">
          <button onclick="deletePost('${post.id}')" class="btn btn-outline btn-sm" style="width: 100%; color: #dc2626; border-color: #fca5a5; background: #fef2f2;">🗑️ Eliminar (Admin)</button>
        </div>`;
    }
    
    const autor = getLocalDB().users.find(u => u.id === post.userId);
    const pts = autor ? (autor.points || 0) : 0;
    let insignia = '';
    if (pts >= 200) insignia = '<span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; margin-left:4px;">⭐ DESTACADO</span>';
    else if (pts >= 100) insignia = '<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; margin-left:4px;">🌟 MUY ACTIVO</span>';
    else if (pts >= 50) insignia = '<span style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; margin-left:4px;">🔥 ACTIVO</span>';
    else if (pts >= 20) insignia = '<span style="background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; margin-left:4px;">🌱 COLABORADOR</span>';
    else if (pts >= 10) insignia = '<span style="background:#f3e8ff; color:#7e22ce; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; margin-left:4px;">✨ NOVATO</span>';

    const nombreHtml = `<span onclick="openPublicProfile('${post.userId}')" style="cursor:pointer; padding:4px; touch-action:manipulation; text-decoration: underline; text-decoration-color: var(--teal-500);">${post.userName}</span>`;

    html += `
      <div class="barrio-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; position: relative;">
        ${cintaHtml}
        <div style="padding: 1rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span style="font-size: 10px; font-weight: 700; color: var(--teal-700); text-transform: uppercase;">${catLabel}</span>
              <span style="font-size: 10px; color: var(--text-muted);">${time}</span>
            </div>
            <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">${post.title}</h4>
            ${post.price ? `<p style="font-size: 13px; font-weight: bold; color: var(--teal-700); margin-bottom: 0.5rem;">${post.price}</p>` : ''}
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.4;">${post.description}</p>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted); margin-bottom: 0.5rem;">
              <div>👤 ${nombreHtml} ${insignia} ${editadoHtml}</div>
              <div>📍 ${post.neighborhoodName}</div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
              <button onclick="toggleLike('${post.id}')" class="btn btn-outline btn-sm" style="flex: 1; ${hasLiked ? 'color: #dc2626; border-color: #fca5a5; background: #fef2f2;' : ''}">
                ❤️ ${likesCount > 0 ? likesCount : ''}
              </button>
              <button onclick="toggleComments('${post.id}')" class="btn btn-outline btn-sm" style="flex: 1;">💬 ${post.commentsCount ? post.commentsCount : 'Comentar'}</button>
              <button onclick="sharePost('${post.id}')" class="btn btn-outline btn-sm" style="flex: 1;">🔗</button>
            </div>

            <div id="comments-${post.id}" class="hidden comment-box">
              <div id="comments-list-${post.id}" class="comment-list"></div>
              <div style="display: flex; gap: 0.25rem;">
                <input type="text" id="comment-input-${post.id}" placeholder="Escribí un comentario..." style="flex: 1; padding: 0.25rem 0.5rem; font-size: 11px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary);" />
                <button onclick="addComment('${post.id}')" class="btn btn-teal btn-sm" style="padding: 0.25rem 0.5rem;">Enviar</button>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
              ${post.phone ? `<a href="https://wa.me/${post.phone.replace(/[^0-9]/g, '')}?text=Hola! Vi tu anuncio en Capilla Conecta." target="_blank" class="btn btn-teal btn-sm" style="flex: 1; text-decoration: none; justify-content: center;">💬 Contactar</a>` : ''}
              ${timerHtml}
            </div>

            ${botonesAutorHtml}
            ${botonesAdminHtml}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  const filterBarrio = document.getElementById('filter-barrio');
  if (filterBarrio && filterBarrio.options.length === 1) {
    filterBarrio.innerHTML += BARRIOS_CAPILLA.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('');
  }

  if (window.__pendingBarrioFilter) {
    const fb = document.getElementById('filter-barrio');
    if (fb) fb.value = window.__pendingBarrioFilter;
    window.__pendingBarrioFilter = null;
    const txt = document.getElementById('filter-text')?.value.toLowerCase() || '';
    const cat = document.getElementById('filter-category')?.value || 'todos';
    const barrioSel = document.getElementById('filter-barrio')?.value || 'todos';
    const filtrados = allPosts.filter(post => {
      const matchText = post.title.toLowerCase().includes(txt) || post.description.toLowerCase().includes(txt);
      const matchCat = cat === 'todos' || post.category === cat;
      const matchBarrio = barrioSel === 'todos' || post.neighborhoodId === barrioSel;
      return matchText && matchCat && matchBarrio;
    });
    if (filtrados.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 2rem; grid-column: 1 / -1;">No hay anuncios en ese barrio.</div>`;
    }
  }
}

function startTimer(postId, timeLeft) {
  if (activeTimers.has(postId)) {
    clearInterval(activeTimers.get(postId));
    activeTimers.delete(postId);
  }

  const timerEl = document.getElementById(`timer-${postId}`);
  const btnsEl = document.getElementById(`autor-btns-${postId}`);
  const cintasEl = document.getElementById(`cintas-row-${postId}`);
  if (!timerEl) return;

  const interval = setInterval(() => {
    timeLeft -= 1000;
    if (timeLeft <= 0) {
      clearInterval(interval);
      activeTimers.delete(postId);
      timerEl.remove();
      if (btnsEl) btnsEl.remove();
      if (cintasEl) cintasEl.remove();
    } else {
      const mins = Math.floor(timeLeft / 60000);
      const secs = Math.floor((timeLeft % 60000) / 1000);
      timerEl.innerHTML = `⏱️ ${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }, 1000);

  activeTimers.set(postId, interval);
}

// ===== LIKES Y COMENTARIOS =====
async function toggleLike(postId) {
  if (!window.Firebase) return;
  const { db, ref, get, set, remove } = window.Firebase;
  const likeRef = ref(db, `posts/${postId}/likes/${currentUser.id}`);
  const snapshot = await get(likeRef);
  if (snapshot.exists()) {
    remove(likeRef);
  } else {
    set(likeRef, true);
  }
}

async function toggleVote(postId, postUserId) {
  if (!window.Firebase || !currentUser) return;
  if (postUserId === currentUser.id) return showToast('No podés votarte a vos mismo 😉');

  const { db, ref, get, set, remove } = window.Firebase;
  const voteRef = ref(db, `posts/${postId}/votes/${currentUser.id}`);

  try {
    const snapshot = await get(voteRef);
    if (snapshot.exists()) {
      await remove(voteRef);
      showToast('Voto retirado');
    } else {
      await set(voteRef, true);
      showToast('¡Voto enviado! ⭐');
    }
  } catch (e) {
    showToast('Error al votar');
  }
}

async function toggleComments(postId) {
  const box = document.getElementById(`comments-${postId}`);
  const isHidden = box.classList.contains('hidden');
  box.classList.toggle('hidden');
  if (isHidden) {
    loadComments(postId);
  } else {
    if (unsubComments.has(postId)) {
      try { unsubComments.get(postId)(); } catch(e){}
      unsubComments.delete(postId);
    }
  }
}

async function loadComments(postId) {
  if (!window.Firebase) return;
  const { db, ref, onValue } = window.Firebase;
  const commentsRef = ref(db, `posts/${postId}/comments`);
  const list = document.getElementById(`comments-list-${postId}`);
  if (!list) return;

  if (unsubComments.has(postId)) {
    try { unsubComments.get(postId)(); } catch(e){}
    unsubComments.delete(postId);
  }

  const unsub = onValue(commentsRef, (snapshot) => {
    if (!list) return;
    list.innerHTML = '';
    if (!snapshot.exists()) {
      list.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center;">No hay comentarios aún.</div>';
    } else {
      snapshot.forEach(child => {
        const c = child.val();
        list.innerHTML += `<div><b>${c.userName}:</b> ${c.text}</div>`;
      });
    }
  });

  unsubComments.set(postId, unsub);
}

async function addComment(postId) {
  if (!window.Firebase) return;
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;
  const { db, ref, push, serverTimestamp } = window.Firebase;
  await push(ref(db, `posts/${postId}/comments`), {
    userId: currentUser.id,
    userName: currentUser.displayName || currentUser.email.split('@')[0],
    text: text,
    createdAt: serverTimestamp()
  });
  input.value = '';
}

function sharePost(postId) {
  const url = window.location.origin + window.location.pathname + '#post-' + postId;
  const text = `¡Mirá este anuncio en Capilla Conecta! ${url}`;
  if (navigator.share) {
    navigator.share({ title: 'Capilla Conecta', text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('¡Enlace copiado!'));
  }
}

// ===== CREAR Y EDITAR ANUNCIOS =====
function openCreatePostModal() {
  document.getElementById('create-post-modal').classList.remove('hidden');
  const sel = document.getElementById('post-neighborhood');
  sel.innerHTML = BARRIOS_CAPILLA.map(b => `<option value="${b.id}" ${b.id === currentUser.neighborhoodId ? 'selected' : ''}>${b.icon} ${b.name}</option>`).join('');
  document.getElementById('post-error').classList.add('hidden');
  document.getElementById('create-post-form').reset();
  document.getElementById('create-post-form').dataset.editId = '';
  document.querySelector('#create-post-modal .modal-header h3').textContent = 'Nuevo Anuncio';
}
function closeCreatePostModal() { document.getElementById('create-post-modal').classList.add('hidden'); }

function handleCreatePost(e) {
  e.preventDefault();
  if (!window.Firebase) return showToast('Error: Firebase no listo.');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';
  }
  const { db, ref, push, set, serverTimestamp } = window.Firebase;
  const errEl = document.getElementById('post-error'); errEl.classList.add('hidden');

  const title = document.getElementById('post-title').value.trim();
  const category = document.getElementById('post-category').value;
  const price = document.getElementById('post-price').value.trim();
  const description = document.getElementById('post-desc').value.trim();
  const neighborhoodId = document.getElementById('post-neighborhood').value;
  const editId = document.getElementById('create-post-form').dataset.editId;

  if (!title || !description) { errEl.textContent = 'El título y la descripción son obligatorios.'; errEl.classList.remove('hidden'); return; }
  const barrio = getBarrio(neighborhoodId);

  const postData = {
    userId: currentUser.id,
    userName: getFormattedUserName(currentUser),
    userAvatar: currentUser.avatarEmoji,
    userPoints: currentUser.points || 0,
    neighborhoodId: neighborhoodId,
    neighborhoodName: barrio ? barrio.name : neighborhoodId,
    phone: currentUser.phoneVisible ? currentUser.phone : '',
    title,
    category,
    price,
    description,
    timestamp: Date.now()
  };

  if (editId) {
    const existing = allPosts.find(p => p.id === editId);
    set(ref(db, 'posts/' + editId), {
      ...postData,
      edited: true,
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    }).then(() => { closeCreatePostModal(); showToast('Anuncio actualizado.'); 
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar Cambios'; } 
    }).catch(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar Cambios'; } 
    });
  } else {
    postData.createdAt = new Date().toISOString();
    
    if (currentUser.emailVerified) {
      const dbLocal = getLocalDB();
      const idx = dbLocal.users.findIndex(u => u.id === currentUser.id);
      if (idx > -1) {
        dbLocal.users[idx].points = (dbLocal.users[idx].points || 0) + 5;
        saveLocalDB(dbLocal);
        currentUser.points = dbLocal.users[idx].points;
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        showToast('¡Ganaste +5 puntos de vecino! ⭐');
      }
    }

    push(ref(db, 'posts'), postData).then(() => {
      closeCreatePostModal();
      showToast('¡Anuncio publicado!');
      notifyBarrioNewPost(postData, neighborhoodId);
      
      const mentions = [];
      const mentionRegex = /@([a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]+)/g;
      let match;
      const textoCompleto = title + ' ' + description;
      while ((match = mentionRegex.exec(textoCompleto)) !== null) {
        mentions.push(match[1].toLowerCase());
      }
      
      if (mentions.length > 0) {
        const dbLocalM = getLocalDB();
        const notifRef = ref(db, 'notifications');
        
        mentions.forEach(name => {
          dbLocalM.users.forEach(u => {
            const nombreUsuario = (u.displayName || u.email.split('@')[0]).toLowerCase().split(' ')[0];
            const emailUsuario = u.email.split('@')[0].toLowerCase();
            
            if ((nombreUsuario === name || emailUsuario === name) && u.id !== currentUser.id) {
              push(notifRef, {
                userId: u.id,
                fromName: currentUser.displayName || currentUser.email.split('@')[0],
                text: `Te mencionó en un anuncio: "${title}"`,
                roomId: 'tablon',
                type: 'mention',
                read: false,
                createdAt: serverTimestamp()
              });
            }
          });
        });
      }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Publicar Anuncio'; }
    }).catch(() => {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Publicar Anuncio'; }
    });
  }
}

function notifyBarrioNewPost(postData, neighborhoodId) {
  if (!window.Firebase) return;
  const { db, ref, push, serverTimestamp } = window.Firebase;
  const notifRef = ref(db, 'notifications');
  const dbLocal = getLocalDB();
  const barrio = getBarrio(neighborhoodId);

  dbLocal.users.forEach(u => {
    if (u.id !== currentUser.id && u.neighborhoodId === neighborhoodId) {
      push(notifRef, {
        userId: u.id,
        fromName: currentUser.displayName || currentUser.email.split('@')[0],
        text: `Publicó en el tablón: ${postData.title}`,
        roomId: 'tablon',
        type: 'tablon',
        barrioId: neighborhoodId,
        barrioName: barrio ? barrio.name : neighborhoodId,
        read: false,
        createdAt: serverTimestamp()
      });
    }
  });
}

function openEditPostModal(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;
  openCreatePostModal();
  document.getElementById('create-post-form').dataset.editId = postId;
  document.querySelector('#create-post-modal .modal-header h3').textContent = 'Editar Anuncio';
  document.getElementById('post-title').value = post.title;
  document.getElementById('post-category').value = post.category;
  document.getElementById('post-price').value = post.price || '';
  document.getElementById('post-desc').value = post.description;
  document.getElementById('post-neighborhood').value = post.neighborhoodId;
}

function deletePost(postId) {
  if (!confirm('¿Seguro que querés eliminar tu anuncio?')) return;
  if (!window.Firebase) return;
  const { db, ref, remove } = window.Firebase;
  remove(ref(db, 'posts/' + postId)).then(() => showToast('Anuncio eliminado.'));
}

async function deleteChatMsg(roomId, msgId) {
  if (!confirm('¿Seguro que querés eliminar este mensaje?')) return;
  if (!window.Firebase) return;
  
  const { db, ref, remove } = window.Firebase;
  try {
    await remove(ref(db, 'chats/' + roomId + '/' + msgId));
    showToast('Mensaje eliminado');
  } catch(e) {
    showToast('Error al eliminar el mensaje');
  }
}

async function openEditChatMsg(roomId, msgId, textoActual) {
  const nuevoTexto = prompt('Editá tu mensaje:', textoActual);
  if (nuevoTexto === null || nuevoTexto.trim() === '' || nuevoTexto === textoActual) return;
  
  if (!window.Firebase) return;
  const { db, ref, update, serverTimestamp } = window.Firebase;
  
  try {
    await update(ref(db, 'chats/' + roomId + '/' + msgId), {
      text: nuevoTexto.trim(),
      edited: true,
      editedAt: Date.now()
    });
    showToast('Mensaje editado');
  } catch(e) {
    showToast('Error al editar el mensaje');
  }
}

// ===== FILTROS =====
function openFilterModal() { document.getElementById('filter-modal').classList.remove('hidden'); }
function closeFilterModal() { document.getElementById('filter-modal').classList.add('hidden'); }
function clearFilters() {
  document.getElementById('filter-text').value = '';
  document.getElementById('filter-category').value = 'todos';
  document.getElementById('filter-barrio').value = 'todos';
  applyFilters();
}

// ===== COMERCIOS =====
function renderComercios() {
  const categoriasActivas = Object.keys(CATEGORIAS_CONFIG).filter(cat => CATEGORIAS_CONFIG[cat].activa);
  let html = `<div class="view-container"><div class="barrios-header" style="background: linear-gradient(135deg, #b45309, #78350f); margin-bottom: 1rem;"><div class="badge">🏪 Guía de Comercios</div><h2>Comercios y Servicios</h2><p>Elegí una categoría.</p></div><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">`;
  categoriasActivas.forEach(cat => {
    const conf = CATEGORIAS_CONFIG[cat]; const count = COMERCIOS_DATA.filter(c => c.categoria === cat && c.activo).length;
    html += `<div onclick="abrirCategoria('${cat}')" style="cursor: pointer; border-radius: 16px; overflow: hidden; position: relative; height: 160px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'"><img src="${conf.imagen}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;"><div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div><div style="position: absolute; bottom: 0; left: 0; padding: 1rem; color: white; width: 100%;"><div style="font-size: 32px; margin-bottom: 0.25rem;">${conf.icono}</div><h3 style="font-size: 18px; font-weight: 700; margin: 0;">${cat}</h3><p style="font-size: 12px; opacity: 0.9; margin: 0;">${count} comercios</p></div></div>`;
  });
  html += `</div></div>`; return html;
}
function renderComerciosCategoria(cat) {
  const conf = CATEGORIAS_CONFIG[cat]; const items = COMERCIOS_DATA.filter(c => c.categoria === cat && c.activo);
  items.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
  let html = `<div class="view-container"><div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;"><button onclick="volverAComercios()" class="btn btn-outline" style="padding: 0.5rem; border-radius: 50%; width: 40px; height: 40px;">←</button><div><h2 style="font-size: 20px; font-weight: 700;">${conf.icono} ${cat}</h2><p style="font-size: 12px; color: var(--text-muted);">${items.length} comercios</p></div></div><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">`;
  items.forEach(c => {
    const visual = c.imagenUrl ? `<img src="${c.imagenUrl}" style="width: 100%; height: 140px; object-fit: cover;">` : `<div style="width: 100%; height: 140px; background: linear-gradient(135deg, ${c.color}, ${c.color}dd); display: flex; align-items: center; justify-content: center; font-size: 56px;">${c.icono}</div>`;
    const estrellasHtml = `<button onclick="votarComercio(${c.id}, '${c.titulo}')" style="background: #fffbeb; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 999px; cursor: pointer;"><span style="font-size: 12px; font-weight: bold; color: #b45309;">⭐ ${c.puntuacion || '0.0'}</span></button>`;
    let etiquetasHtml = c.etiquetas?.length ? `<div style="display: flex; gap: 0.25rem; flex-wrap: wrap; margin-bottom: 0.5rem;">${c.etiquetas.map(et => `<span style="font-size: 10px; background: var(--slate-100); padding: 2px 6px; border-radius: 4px;">${et}</span>`).join('')}</div>` : '';
    let horarioHtml = c.horarios ? `<p style="font-size: 11px; color: var(--text-muted); margin-bottom: 0.25rem;">🕒 ${c.horarios}</p>` : '';
    if (c.turno) horarioHtml += `<p style="font-size: 11px; color: #16a34a; font-weight: bold;">🚨 ${c.turno}</p>`;
    let botonesAcciones = c.telefono ? `<a href="https://wa.me/${c.telefono}" target="_blank" class="btn btn-teal btn-sm" style="flex: 1;">WhatsApp</a>` : '';
    if (c.delivery) botonesAcciones += `<span class="btn btn-outline btn-sm" style="flex: 1;">🛵 Delivery</span>`;
    if (c.coordenadas) botonesAcciones += `<a href="https://www.google.com/maps/search/?api=1&query=${c.coordenadas}" target="_blank" class="btn btn-outline btn-sm" style="flex: 1;">📍 Ir</a>`;
    const badgeDestacado = c.destacado ? `<div style="position: absolute; top: 10px; right: 10px; background: #f59e0b; color: white; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 999px; z-index: 10;">⭐ Destacado</div>` : '';
    html += `<div class="barrio-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; position: relative;">${visual}${badgeDestacado}<div style="padding: 1rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;"><div><div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;"><h4 style="font-size: 15px; font-weight: 700;">${c.titulo}</h4>${estrellasHtml}</div><p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 0.5rem;">${c.desc}</p>${c.direccion ? `<p style="font-size: 11px; color: var(--text-muted); margin-bottom: 0.5rem;">📍 ${c.direccion}</p>` : ''}${horarioHtml}${etiquetasHtml}</div><div style="margin-top: 0.5rem;"><div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">${botonesAcciones}</div><div style="display: flex; gap: 0.5rem; flex-wrap: wrap; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">${c.redes.web && c.webUrl ? `<a href="${c.webUrl}" target="_blank" class="btn btn-outline btn-sm" style="flex: 1;">🌐 Web</a>` : ''}${c.redes.facebook && c.facebookUrl ? `<a href="${c.facebookUrl}" target="_blank" class="btn btn-outline btn-sm" style="flex: 1; color: #1877f2;">Facebook</a>` : ''}${c.redes.instagram && c.instagramUrl ? `<a href="${c.instagramUrl}" target="_blank" class="btn btn-outline btn-sm" style="flex: 1; color: #e1306c;">Instagram</a>` : ''}</div></div></div></div>`;
  });
  html += `</div></div>`; return html;
}
function abrirCategoria(cat) {
  const main = document.getElementById('main-content'); const detalle = document.getElementById('comercios-detalle');
  main.classList.add('hidden'); detalle.classList.remove('hidden'); detalle.innerHTML = renderComerciosCategoria(cat); detalle.scrollTop = 0;
  history.pushState({ view: 'comercios-categoria', cat: cat }, '', '#comercios-' + cat);
}
function volverAComercios(pushState = true) {
  const main = document.getElementById('main-content'); const detalle = document.getElementById('comercios-detalle');
  detalle.classList.add('hidden'); main.classList.remove('hidden'); main.innerHTML = renderComercios();
  if (pushState) history.pushState({ view: 'comercios' }, '', '#comercios');
}
window.addEventListener('popstate', () => { const detalle = document.getElementById('comercios-detalle'); if (detalle && !detalle.classList.contains('hidden')) volverAComercios(false); });

// ===== BARRIOS =====
function renderBarrios() {
  const db = getLocalDB(); const myBarrio = currentUser ? currentUser.neighborhoodId : null;
  const cards = BARRIOS_CAPILLA.map(b => {
    const isMine = b.id === myBarrio; const userCount = Math.max(1, db.users.filter(u => u.neighborhoodId === b.id).length);
    const postCount = db.posts.filter(p => p.neighborhoodId === b.id).length;
    return `<div class="barrio-card ${isMine ? 'mine' : ''}"><div><div class="barrio-card-head"><span class="icon">${b.icon}</span><div><h3>${b.name}</h3>${isMine ? '<span class="mine-tag">✓ Tu Barrio</span>' : ''}</div></div><p>${b.description}</p></div><div><div class="barrio-card-stats"><span>👥 ${userCount} vecinos</span><span>${postCount} anuncios</span></div><div class="barrio-card-actions"><button class="btn btn-teal btn-sm" onclick="goToBarrioChat('${b.id}')">💬 Chat</button><button class="btn btn-outline btn-sm" onclick="goToBarrioTablón('${b.id}')">📋 Anuncios</button></div></div></div>`;
  }).join('');
  return `<div class="view-container"><div class="barrios-header"><div class="badge">🧭 Guía Vecinal</div><h2>Los 20 Barrios</h2><p>Cada sector tiene su propio chat y tablón.</p></div><div class="barrios-grid">${cards}</div></div>`;
}
function goToBarrioChat(barrioId) {
  window.__pendingBarrioChat = barrioId;
  selectTab('barrio-chat');
}
function goToBarrioTablón(barrioId) {
  const b = getBarrio(barrioId);
  window.__pendingBarrioFilter = barrioId;
  selectTab('tablon');
  showToast('Mostrando anuncios de ' + (b ? b.name : barrioId));
}

// ===== PERFIL, INSTALL Y OTROS =====
// ===== PERFIL PROPIO =====
function openProfileModal() {
  if (!currentUser) return;
  const modal = document.getElementById('profile-modal'); modal.classList.remove('hidden');
  document.getElementById('profile-avatar').textContent = currentUser.avatarEmoji;
  document.getElementById('profile-formatted-name').textContent = getFormattedUserName(currentUser);
  document.getElementById('prof-name').value = currentUser.displayName || '';
  document.getElementById('prof-phone').value = currentUser.phone || '';
  document.getElementById('prof-phone-visible').checked = !!currentUser.phoneVisible;
  document.getElementById('prof-bio').value = currentUser.bio || '';
    // 👇 RECALCULAMOS EL CONTADOR DE CARACTERES AL ABRIR EL PERFIL 👇
  const bioInput = document.getElementById('prof-bio');
  const bioCounter = document.getElementById('bio-counter');
  if (bioInput && bioCounter) {
    bioCounter.textContent = (150 - bioInput.value.length) + ' caracteres restantes';
  }
  // 👆 FIN DEL ARREGLO 👆
  selectedProfileAvatar = currentUser.avatarEmoji;
  buildAvatarGrid('prof-avatar-grid', selectedProfileAvatar, e => selectedProfileAvatar = e);
  
  const lastChange = new Date(currentUser.lastNeighborhoodChange || currentUser.createdAt).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const canChange = (Date.now() - lastChange) >= thirtyDays || currentUser.role === 'admin';
  
  const lockEl = document.getElementById('prof-neighborhood-lock'); 
  const selEl = document.getElementById('prof-neighborhood'); 
  const lockedEl = document.getElementById('prof-neighborhood-locked');
  
  if (canChange) { 
    selEl.classList.remove('hidden'); lockedEl.classList.add('hidden'); lockEl.classList.add('hidden'); 
    buildNeighborhoodSelect('prof-neighborhood', currentUser.neighborhoodId); 
  } else { 
    const daysLeft = Math.max(1, Math.ceil((thirtyDays - (Date.now() - lastChange)) / (24 * 60 * 60 * 1000))); 
    selEl.classList.add('hidden'); lockedEl.classList.remove('hidden'); lockEl.classList.remove('hidden'); 
    lockEl.textContent = `🔒 Bloqueado por ${daysLeft} días`; 
    const barrio = getBarrio(currentUser.neighborhoodId); 
    lockedEl.innerHTML = `<span>📍 Barrio <b>${barrio ? barrio.name : currentUser.neighborhoodId}</b></span>`; 
  }
  
  document.getElementById('profile-error').classList.add('hidden'); 
  document.getElementById('profile-success').classList.add('hidden');

  if (window.Firebase) {
    const { db, ref, get } = window.Firebase;
    get(ref(db, 'perfiles/' + currentUser.id + '/puntos')).then(snap => {
      const pts = snap.val() || 0;
      
      const displayEl = document.getElementById('profile-points-display');
      if (displayEl) displayEl.textContent = pts;
      
      const RANGOS = [
        { min: 0,   max: 4,   nombre: 'Vecino',      color: '#64748b', bg: '#f1f5f9', icon: '👤' },
        { min: 5,   max: 19,  nombre: 'Novato',      color: '#7e22ce', bg: '#f3e8ff', icon: '✨' },
        { min: 20,  max: 49,  nombre: 'Colaborador', color: '#15803d', bg: '#dcfce7', icon: '🌱' },
        { min: 50,  max: 99,  nombre: 'Activo',      color: '#b91c1c', bg: '#fee2e2', icon: '🔥' },
        { min: 100, max: 199, nombre: 'Muy Activo',  color: '#0369a1', bg: '#e0f2fe', icon: '🌟' },
        { min: 200, max: 9999,nombre: 'Destacado',   color: '#b45309', bg: '#fef3c7', icon: '⭐' }
      ];

      let rangoActual = RANGOS.find(r => pts >= r.min && pts <= r.max) || RANGOS[0];
      let siguienteRango = RANGOS[RANGOS.indexOf(rangoActual) + 1];

      const badgeEl = document.getElementById('profile-badge-display');
      if (badgeEl) {
        badgeEl.textContent = `${rangoActual.icon} ${rangoActual.nombre}`;
        badgeEl.style.color = rangoActual.color;
        badgeEl.style.background = rangoActual.bg;
        badgeEl.style.borderColor = rangoActual.color + '55';
      }

      const progressBar = document.getElementById('my-progress-bar');
      const progressText = document.getElementById('my-progress-text');
      const progressTarget = document.getElementById('my-progress-target');
      const progressPercent = document.getElementById('my-progress-percent');
      
      if (siguienteRango) {
        let rangoTotal = siguienteRango.min - rangoActual.min;
        let progresoEnRango = pts - rangoActual.min;
        let porcentaje = (progresoEnRango / rangoTotal) * 100;
        
        if (progressBar) { progressBar.style.width = porcentaje + '%'; progressBar.style.background = rangoActual.color; }
        if (progressTarget) progressTarget.textContent = `Próximo: ${siguienteRango.icon} ${siguienteRango.nombre}`;
        if (progressPercent) progressPercent.textContent = Math.round(porcentaje) + '%';
        if (progressText) progressText.textContent = `${pts} / ${siguienteRango.min} votos`;
      } else {
        if (progressBar) { progressBar.style.width = '100%'; progressBar.style.background = rangoActual.color; }
        if (progressTarget) progressTarget.textContent = '¡Nivel Máximo!';
        if (progressPercent) progressPercent.textContent = '100%';
        if (progressText) progressText.textContent = `${pts} votos - ¡Gracias por ser un pilar!`;
      }

      const pathIds = ['my-path-vecino', 'my-path-novato', 'my-path-colaborador', 'my-path-activo', 'my-path-muyactivo', 'my-path-destacado'];
      pathIds.forEach((id, index) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (index <= RANGOS.indexOf(rangoActual)) {
          el.style.opacity = '1';
          el.style.transform = 'scale(1.1)';
        } else {
          el.style.opacity = '0.3';
          el.style.transform = 'scale(1)';
        }
      });
    });
  }

  const btnVotar = document.getElementById('btn-votar-perfil');
  if (btnVotar) btnVotar.style.display = 'none';
  const guestWarning = document.getElementById('guest-profile-warning');
  const pointsCard = document.getElementById('profile-points-card'); 

  // 👇 VERIFICAMOS SI ES INVITADO O REGISTRADO 👇
  const esInvitado = currentUser.email && currentUser.email.includes('@capillaconecta.local');
  
  if (esInvitado) {
    if (guestWarning) guestWarning.classList.remove('hidden');
    if (pointsCard) pointsCard.style.display = 'none';
  } else {
    if (guestWarning) guestWarning.classList.add('hidden');
    if (pointsCard) pointsCard.style.display = 'block';
  }
} // <-- ESTA LLAVE CIERRA openProfileModal

// ===== PERFIL PÚBLICO =====
async function openPublicProfile(userId) {
  if (userId === currentUser.id) {
    openProfileModal();
    return;
  }
  
  currentProfileTarget = userId;
  
  if (!window.Firebase) return;
  const { db, ref, get } = window.Firebase;
  
  document.getElementById('public-profile-modal').classList.remove('hidden');
  document.getElementById('pub-name').textContent = 'Cargando...';
  document.getElementById('pub-points').textContent = '...';
  
  try {
    let perfilSnap = await get(ref(db, 'perfiles/' + userId));
    const puntosSnap = await get(ref(db, 'perfiles/' + userId + '/puntos'));

    if (!perfilSnap.exists()) {
      const usuarioLocal = getLocalDB().users.find(x => x.id === userId);
      if (usuarioLocal) {
        const { ref: refUpdate, update } = window.Firebase;
        await update(refUpdate(db, 'perfiles/' + userId), {
          displayName: usuarioLocal.displayName,
          neighborhoodId: usuarioLocal.neighborhoodId,
          avatarEmoji: usuarioLocal.avatarEmoji,
          bio: usuarioLocal.bio || ''
        });
        const nuevoSnap = await get(ref(db, 'perfiles/' + userId));
        if (nuevoSnap.exists()) {
          perfilSnap = nuevoSnap;
        }
      }
    }
    
    if (!perfilSnap.exists()) {
      showToast('El perfil aún no está sincronizado.');
      const u = getLocalDB().users.find(x => x.id === userId);
      if (u) {
        document.getElementById('pub-name').textContent = u.displayName;
        document.getElementById('pub-barrio').textContent = '📍 ' + (getBarrio(u.neighborhoodId)?.name || u.neighborhoodId);
      }
      return;
    }
    
    const perfil = perfilSnap.val();
    const pts = puntosSnap.val() || 0;
    
    document.getElementById('pub-avatar').textContent = perfil.avatarEmoji || '⛰️';
    document.getElementById('pub-name').textContent = perfil.displayName || 'Vecino';
    document.getElementById('pub-barrio').textContent = '📍 ' + (getBarrio(perfil.neighborhoodId)?.name || perfil.neighborhoodId || 'Capilla');
    document.getElementById('pub-bio').textContent = perfil.bio ? `"${perfil.bio}"` : 'Sin biografía.';
    document.getElementById('pub-points').textContent = pts;
    
    const badgeEl = document.getElementById('pub-badge');
    const pointsContainer = document.getElementById('pub-points-container');
    
    if (pts > 0) {
      if (pointsContainer) pointsContainer.style.display = 'block';
      
      let badgeText = '';
      let badgeColor = '';
      if (pts >= 200) { badgeText = '⭐ DESTACADO'; badgeColor = '#b45309'; }
      else if (pts >= 100) { badgeText = '🌟 MUY ACTIVO'; badgeColor = '#0369a1'; }
      else if (pts >= 50) { badgeText = '🔥 ACTIVO'; badgeColor = '#b91c1c'; }
      else if (pts >= 20) { badgeText = '🌱 COLABORADOR'; badgeColor = '#15803d'; }
      else if (pts >= 10) { badgeText = '✨ NOVATO'; badgeColor = '#7e22ce'; }
      else { badgeText = 'Vecino'; badgeColor = '#64748b'; }
      
      badgeEl.style.display = 'inline-block'; 
      badgeEl.textContent = badgeText;
      badgeEl.style.color = badgeColor;
      badgeEl.style.borderColor = badgeColor + '55';
      
      const progressBar = document.getElementById('pub-progress-bar');
      const progressText = document.getElementById('pub-progress-text');
      
      if (progressBar && progressText) {
        let porcentaje = (pts / 200) * 100;
        if (porcentaje > 100) porcentaje = 100;
        
        progressBar.style.width = porcentaje + '%';
        
        if (pts >= 200) {
          progressText.textContent = "¡Nivel máximo alcanzado! 🌟";
        } else {
          progressText.textContent = pts + " / 200 votos para ser Destacado";
        }
      }
      
    } else {
      if (pointsContainer) pointsContainer.style.display = 'none';
      if (badgeEl) badgeEl.style.display = 'none';
      
      const progressBar = document.getElementById('pub-progress-bar');
      const progressText = document.getElementById('pub-progress-text');
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.textContent = "0 / 200 votos para ser Destacado";
    }

    const votoKey = `voto_hecho_${currentUser.id}_a_${userId}`;
    const yaVoto = localStorage.getItem(votoKey) === 'true';
    const btn = document.getElementById('btn-public-votar');
    if (yaVoto) {
      btn.textContent = 'Quitar mi voto';
      btn.className = 'btn btn-outline btn-block btn-lg';
    } else {
      btn.textContent = '⭐ Votar a este vecino';
      btn.className = 'btn btn-teal btn-block btn-lg';
    }
  } catch(e) {
    console.error(e);
    showToast('Error al cargar el perfil');
  }

  const adminActions = document.getElementById('admin-ban-actions');
  if (adminActions) {
    if ((currentUser.role === 'admin' || currentUser.role === 'moderator') && userId !== currentUser.id) {
      adminActions.style.display = 'block';
    } else {
      adminActions.style.display = 'none';
    }
  }

  document.getElementById('public-profile-modal').classList.remove('hidden');
}

function closePublicProfile() {
  document.getElementById('public-profile-modal').classList.add('hidden');
  currentProfileTarget = null;
}

async function banearUsuario(tipo) {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) return;
  if (!currentProfileTarget) return;

  const msj = tipo === 'permanente' ? '¿Bloquear a este vecino PARA SIEMPRE?' : '¿Bloquear a este vecino por 30 días?';
  if (!confirm(msj)) return;

  if (window.Firebase) {
    const { db, ref, update } = window.Firebase;
    try {
      let banData = {};
      if (tipo === 'permanente') {
        banData = { isBanned: true, banExpires: null };
      } else {
        const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
        banData = { isBanned: true, banExpires: expiryDate };
      }

      await update(ref(db, 'perfiles/' + currentProfileTarget), banData);
      
      const dbLocal = getLocalDB();
      const idx = dbLocal.users.findIndex(u => u.id === currentProfileTarget);
      if (idx > -1) {
        dbLocal.users[idx].isBanned = true;
        dbLocal.users[idx].banExpires = banData.banExpires;
        saveLocalDB(dbLocal);
      }
      
      showToast('Usuario bloqueado correctamente 🚫');
      closePublicProfile();
    } catch(e) {
      showToast('Error al bloquear usuario');
    }
  }
}

async function limpiarChatGeneral() {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) return;
  
  const mensajeAviso = "⚠️ ATENCIÓN: Esta acción borrará PERMANENTEMENTE los mensajes del Chat General con más de 24 horas.\n\nAntes de continuar, asegurate de haber exportado el JSON desde la consola de Firebase si querés guardar un historial.\n\n¿Querés continuar?";
  
  if (!confirm(mensajeAviso)) return;
  
  if (!window.Firebase) return;
  const { db, ref, get, remove } = window.Firebase;
  const chatRef = ref(db, 'chats/todos-juntos');
  const ahora = Date.now();
  const limite = 24 * 60 * 60 * 1000; // 24 horas
  
  try {
    const snap = await get(chatRef);
    if (!snap.exists()) return showToast('No hay mensajes en el chat general.');
    
    let borrados = 0;
    const promesas = [];
    
    snap.forEach(child => {
      const msg = child.val();
      const fechaMsg = msg.createdAt || 0;
      if (ahora - fechaMsg > limite) {
        promesas.push(remove(ref(db, 'chats/todos-juntos/' + child.key)));
        borrados++;
      }
    });
    
    await Promise.all(promesas);
    showToast(`Se borraron ${borrados} mensajes viejos del General.`);
  } catch(e) {
    console.error(e);
    showToast('Error al limpiar el chat general.');
  }
}

async function limpiarChatsBarrios() {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) return;
  
    const mensajeAviso = "⚠️ ATENCIÓN: Esta acción borrará PERMANENTEMENTE los mensajes de los Chats de Barrio con más de 7 días.\n\nAntes de continuar, asegurate de haber exportado el JSON desde la consola de Firebase si querés guardar un historial.\n\n¿Querés continuar?";
  
  if (!confirm(mensajeAviso)) return;
  
  if (!window.Firebase) return;
  const { db, ref, get, remove } = window.Firebase;
  const ahora = Date.now();
  const limite = 7 * 24 * 60 * 60 * 1000; // 7 días
  
  try {
    // Buscamos todos los chats que empiecen con "barrio-"
    const chatsSnap = await get(ref(db, 'chats'));
    if (!chatsSnap.exists()) return showToast('No hay chats de barrio.');
    
    let totalBorrados = 0;
    const promesasGlobales = [];
    
    chatsSnap.forEach(chat => {
      if (chat.key.startsWith('barrio-')) {
        chat.forEach(msg => {
          const data = msg.val();
          const fechaMsg = data.createdAt || 0;
          if (ahora - fechaMsg > limite) {
            promesasGlobales.push(remove(ref(db, 'chats/' + chat.key + '/' + msg.key)));
            totalBorrados++;
          }
        });
      }
    });
    
    await Promise.all(promesasGlobales);
    showToast(`Se borraron ${totalBorrados} mensajes viejos de los barrios.`);
  } catch(e) {
    console.error(e);
    showToast('Error al limpiar los chats de barrio.');
  }
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.add('hidden');
}

function handleProfileUpdate(e) {
  e.preventDefault(); 
  if (!currentUser) return;
  
  const displayName = document.getElementById('prof-name').value.trim() || currentUser.displayName;
  const phone = document.getElementById('prof-phone').value.trim();
  const phoneVisible = document.getElementById('prof-phone-visible').checked;
  const bio = document.getElementById('prof-bio').value.trim();
  const newBarrio = document.getElementById('prof-neighborhood').value;
  
  // Validar cambio de barrio (30 días)
  const lastChange = new Date(currentUser.lastNeighborhoodChange || currentUser.createdAt).getTime(); 
  const thirtyDays = 30 * 24 * 60 * 60 * 1000; 
  const canChange = (Date.now() - lastChange) >= thirtyDays || currentUser.role === 'admin';
  
  const updates = {
    displayName: displayName,
    avatarEmoji: selectedProfileAvatar,
    phone: phone,
    phoneVisible: phoneVisible,
    bio: bio
  };
  
  if (canChange && newBarrio && newBarrio !== currentUser.neighborhoodId) {
    updates.neighborhoodId = newBarrio;
    updates.lastNeighborhoodChange = new Date().toISOString();
  }
  
  // 👇 GUARDAMOS DIRECTO EN FIREBASE Y ACTUALIZAMOS EL currentUser LOCAL 👇
  if (window.Firebase) {
    const { db, ref, update } = window.Firebase;
    
    update(ref(db, 'perfiles/' + currentUser.id), updates).then(() => {
      // Actualizamos el objeto currentUser en memoria
      Object.assign(currentUser, updates);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      
      // Actualizamos la UI
      updateUserUI();
      document.getElementById('profile-avatar').textContent = currentUser.avatarEmoji;
      document.getElementById('profile-formatted-name').textContent = getFormattedUserName(currentUser);
       showToast('¡Cambios guardados con éxito!');
      closeProfileModal();
      
        // Mostramos el cartel de éxito
      const successEl = document.getElementById('profile-success');
      successEl.textContent = '¡Cambios guardados con éxito!';
      successEl.style.display = 'block'; // Forzamos que se muestre
      successEl.classList.remove('hidden');
      
      // Cerramos la ventana después de 2.5 segundos
      setTimeout(() => {
        successEl.style.display = 'none';
        successEl.classList.add('hidden');
        closeProfileModal();
      }, 2500);
      
    }).catch((err) => {
      console.error("Error al guardar perfil:", err);
      showToast('Error al guardar los cambios');
    });
  }
}

function openInstallModal() { document.getElementById('install-modal').classList.remove('hidden'); }
function closeInstallModal() { document.getElementById('install-modal').classList.add('hidden'); }
function switchInstallTab(tab, btn) { document.querySelectorAll('.install-tab').forEach(b => b.classList.remove('active')); if (btn) btn.classList.add('active'); document.querySelectorAll('.install-panel').forEach(p => p.classList.add('hidden')); const panel = document.getElementById('install-' + tab); if (panel) panel.classList.remove('hidden'); }
async function installPWA() { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { showToast('¡App instalada!'); closeInstallModal(); } deferredPrompt = null; } else { showToast('Seguí los 3 pasos de abajo.'); } }
function copyLink() { navigator.clipboard.writeText('https://v25405713.github.io/capilla-conecta/docs/').then(() => showToast('¡Enlace copiado!')); }
function shareInvite() {
  const url = window.location.href; const text = `¡Sumate a Capilla Conecta! ${url}`;
  if (navigator.share) navigator.share({ title: 'Capilla Conecta', text, url }).catch(() => copiarAlPortapapeles(text));
  else copiarAlPortapapeles(text);
}
function copiarAlPortapapeles(texto) { navigator.clipboard.writeText(texto).then(() => showToast('¡Invitación copiada!')).catch(() => prompt('Copiá:', texto)); }
async function votarComercio(comercioId, tituloComercio) {
  if (!window.Firebase) return showToast('Error: Firebase no listo.');
  const voto = prompt(`¿Cuántas estrellas a "${tituloComercio}"? (1 al 5)`);
  const numVoto = parseInt(voto); if (isNaN(numVoto) || numVoto < 1 || numVoto > 5) { if (voto !== null) showToast('Voto cancelado.'); return; }
  if (localStorage.getItem(`voto_comercio_${comercioId}`)) return showToast('Ya votaste por este comercio.');
  const { db, ref, runTransaction } = window.Firebase;
  try {
    await runTransaction(ref(db, `comercios_stats/${comercioId}`), (currentData) => currentData === null ? { suma: numVoto, cantidad: 1 } : { suma: (currentData.suma || 0) + numVoto, cantidad: (currentData.cantidad || 0) + 1 });
    localStorage.setItem(`voto_comercio_${comercioId}`, 'true'); showToast('¡Gracias por votar!');
  } catch (error) { showToast('Error al votar.'); }
}

// ===== CINTAS =====
function setCinta(postId, cinta) {
  if (!window.Firebase) return;
  const { db, ref, update } = window.Firebase;
  const post = allPosts.find(p => p.id === postId);
  const newCinta = (post && post.cinta === cinta) ? '' : cinta;
  update(ref(db, 'posts/' + postId), { cinta: newCinta })
    .then(() => showToast(newCinta ? 'Cinta actualizada' : 'Cinta quitada'))
    .catch(() => showToast('Error al actualizar la cinta'));
}

// ===== NOTIFICACIONES (CAMPANA) =====
function listenMyNotifications() {
  if (!window.Firebase || !currentUser) return;
  const { db, ref, onValue } = window.Firebase;

  if (unsubNotifications) { try { unsubNotifications(); } catch(e){} unsubNotifications = null; }

  const notifRef = ref(db, 'notifications');

  unsubNotifications = onValue(notifRef, (snapshot) => {
    const campanaDot = document.getElementById('notif-dot');
    let unreadMentions = 0;

    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const n = child.val();
        if (n.userId === currentUser.id && !n.read) unreadMentions++;
      });
    }

    if (campanaDot) {
      if (unreadMentions === 0) {
        campanaDot.classList.add('hidden');
        campanaDot.textContent = '';
      } else {
        campanaDot.classList.remove('hidden');
        campanaDot.textContent = unreadMentions > 99 ? '99+' : String(unreadMentions);
        campanaDot.style.cssText = 'position: absolute; top: -2px; right: -2px; min-width: 16px; height: 16px; padding: 0 4px; background: #dc2626; color: white; border-radius: 999px; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; line-height: 1;';
      }
    }
  });
}

async function toggleNotifications() {
  if (!window.Firebase || !currentUser) return;
  const { db, ref, get, update } = window.Firebase;

  const modal = document.getElementById('notif-modal');
  const list = document.getElementById('notif-list');
  if (!modal || !list) { showToast('Notificaciones próximamente'); return; }

  modal.classList.remove('hidden');
  list.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:1rem;">Cargando...</div>';

  try {
    const snap = await get(ref(db, 'notifications'));
    const misNotifs = [];
    if (snap.exists()) {
      snap.forEach(child => {
        const n = child.val();
        if (n.userId === currentUser.id) misNotifs.push({ id: child.key, ...n });
      });
    }
    misNotifs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (misNotifs.length === 0) {
      list.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:1rem;">No tenés notificaciones.</div>';
      return;
    }

    list.innerHTML = misNotifs.slice(0, 30).map(n => {
      const icon = n.type === 'tablon' ? '📋' : '💬';
      const title = n.type === 'tablon' ? `Nuevo anuncio en ${n.barrioName || 'tu barrio'}` : `${n.fromName || 'Alguien'} te mencionó`;
      const bg = n.read ? 'var(--bg-card)' : 'rgba(254, 243, 199, 0.6)';
      return `<div onclick="openNotif('${n.id}', '${n.roomId || ''}', ${!!n.read})" style="cursor:pointer; padding:0.625rem; border-radius:10px; background:${bg}; border:1px solid var(--border-color); margin-bottom:0.375rem;">
        <div style="display:flex; gap:0.5rem; align-items:flex-start;">
          <span style="font-size:18px;">${icon}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-size:12px; font-weight:700; color:var(--text-primary);">${title}</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:2px; word-wrap:break-word;">${n.text || ''}</div>
            ${!n.read ? '<div style="font-size:10px; color:#dc2626; font-weight:700; margin-top:2px;">● Sin leer</div>' : ''}
          </div>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    list.innerHTML = '<div style="text-align:center; color:#dc2626; font-size:12px; padding:1rem;">Error al cargar notificaciones.</div>';
  }
}

async function openNotif(notifId, roomId, yaLeida) {
  if (window.Firebase) {
    const { db, ref, update } = window.Firebase;
    try { await update(ref(db, 'notifications/' + notifId), { read: true }); } catch(e) {}
  }
  document.getElementById('notif-modal').classList.add('hidden');

  if (roomId === 'tablon') {
    selectTab('tablon');
  } else if (roomId === 'todos-juntos') {
    selectTab('chat');
  } else if (roomId && roomId.startsWith('barrio-')) {
    const barrioId = roomId.replace('barrio-', '');
    if (currentUser && currentUser.neighborhoodId === barrioId) {
      selectTab('mibarrio');
    } else {
      goToBarrioChat(barrioId);
    }
  }
}

function closeNotifModal() { document.getElementById('notif-modal').classList.add('hidden'); }

// ===== CONTADOR DE MENSAJES NO LEÍDOS =====
function refreshUnreadDots() {
  if (!currentUser) return;
  const roomsToWatch = [
    { roomId: 'todos-juntos', dotDesktop: 'chat-dot-general-desktop', dotMobile: 'chat-dot-general-mobile' },
    { roomId: 'barrio-' + currentUser.neighborhoodId, dotDesktop: 'chat-dot-barrio-desktop', dotMobile: 'chat-dot-barrio-mobile' }
  ];
  roomsToWatch.forEach(r => {
    const count = unreadCounters[r.roomId] || 0;
    const dD = document.getElementById(r.dotDesktop);
    const dM = document.getElementById(r.dotMobile);
    if (dD) dD.classList.toggle('hidden', count === 0);
    if (dM) dM.classList.toggle('hidden', count === 0);
  });
}

function listenUnreadMessages() {
  if (!window.Firebase || !currentUser) return;

  unsubUnread.forEach(fn => { try { fn(); } catch(e){} });
  unsubUnread = [];

  const { db, ref, onValue } = window.Firebase;

  const roomsToWatch = [
    { roomId: 'todos-juntos' },
    { roomId: 'barrio-' + currentUser.neighborhoodId }
  ];

  roomsToWatch.forEach(r => {
    unreadCounters[r.roomId] = 0;
    const msgRef = ref(db, 'chats/' + r.roomId);
    const unsub = onValue(msgRef, (snapshot) => {
      const lastRead = parseInt(localStorage.getItem('lastRead_' + r.roomId) || '0', 10);
      let count = 0;
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const m = child.val();
          const t = m.createdAt || m.timestamp || 0;
          if (t > lastRead && m.userId !== currentUser.id) count++;
        });
      }
      unreadCounters[r.roomId] = count;
      refreshUnreadDots();
    });
    unsubUnread.push(unsub);
  });
}

function listenTotalVecinos() {
  if (!window.Firebase) return;
  const { db, ref, onValue } = window.Firebase;
  const perfilesRef = ref(db, 'perfiles');
  
  onValue(perfilesRef, (snapshot) => {
    let total = 0;
    if (snapshot.exists()) {
      snapshot.forEach(() => total++);
    }
    const el = document.getElementById('online-count');
    if (el) {
      el.textContent = total === 1 ? '1 vecino registrado' : `${total} vecinos registrados`;
    }
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme(); initViewportHeight();
  buildNeighborhoodSelect('reg-neighborhood', '');
  buildAvatarGrid('avatar-grid', selectedAvatar, e => { selectedAvatar = e; updatePreviewName(); });
  
  const regEmailEl = document.getElementById('reg-email');
  if (regEmailEl) regEmailEl.addEventListener('input', updatePreviewName);
  const regNameEl = document.getElementById('reg-name');
  if (regNameEl) regNameEl.addEventListener('input', updatePreviewName);
  const regNeighEl = document.getElementById('reg-neighborhood');
  if (regNeighEl) regNeighEl.addEventListener('change', updatePreviewName);
  
  updatePreviewName();
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
  
      // 👇 LA MAGIA: Escuchar el estado de autenticación 👇
  if (window.Firebase && window.Firebase.onAuthStateChanged) {
    window.Firebase.onAuthStateChanged(window.Firebase.auth, async (user) => {
      if (user) {
        // 1. Chequeo de correo verificado
        const esInvitado = user.email && user.email.includes('@capillaconecta.local');
        
        if (!esInvitado && !user.emailVerified) {
           await window.Firebase.signOut(window.Firebase.auth);
           document.getElementById('auth-modal').classList.remove('hidden');
           document.getElementById('main-header').classList.add('hidden');
           document.getElementById('main-content').classList.add('hidden');
           return;
        }

        // 👇 2. SI EL CORREO ESTÁ VERIFICADO, ACTUALIZAMOS EL PERFIL EN FIREBASE 👇
        if (user.emailVerified && !esInvitado) {
          try {
            const { db, ref, update } = window.Firebase;
            await update(ref(db, 'perfiles/' + user.uid), { emailVerified: true });
            console.log("✅ Perfil actualizado a verificado en Firebase");
          } catch (err) {
            console.error("Error actualizando verificación en perfil:", err);
          }
        }
        // 👆 FIN DEL AGREGADO 👆

        // 3. GUARDAR PERFIL PENDIENTE (CON ESPERA)
        if (window.__pendingProfileData) {
          try {
            await new Promise(r => setTimeout(r, 1000));
            const { db, ref, set } = window.Firebase;
            await set(ref(db, 'perfiles/' + user.uid), window.__pendingProfileData);
            console.log("✅ Perfil guardado con éxito. Barrio:", window.__pendingProfileData.neighborhoodId);
            window.__pendingProfileData = null;
          } catch (err) {
            console.error("Error guardando perfil pendiente:", err);
          }
        }

        // 4. Chequeo si venimos de hacer clic en el correo
        const urlParams = new URLSearchParams(window.location.search);
        const isFromEmailLink = urlParams.has('mode') || urlParams.has('apiKey') || window.location.href.includes('verifyEmail');

        // 5. Logueamos al usuario
        await loginUser(user.uid);

        // 6. Si venimos del correo, limpiamos la URL
        if (isFromEmailLink && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

      } else {
         // 👇 ACÁ ESTÁ EL TRUCO: Si NO hay usuario, chequeamos si hay sesión guardada
        const savedUser = localStorage.getItem(USER_KEY);
        if (!savedUser) {
          // Solo mostramos el login si NO hay nada guardado
        document.getElementById('auth-modal').classList.remove('hidden');
        document.getElementById('main-header').classList.add('hidden');
        document.getElementById('main-content').classList.add('hidden');
        }
      }
    }); // Cierra onAuthStateChanged
  } // Cierra if (window.Firebase...)


  // Forzar el modo invitado al cargar la página
  if (typeof switchRegisterMode === 'function') switchRegisterMode('guest');
    // 👇 LLAMAMOS AL CONTADOR 👇
  listenTotalVecinos();
  // 👆 FIN DE LA LLAMADA 👆
}); // Cierra DOMContentLoaded