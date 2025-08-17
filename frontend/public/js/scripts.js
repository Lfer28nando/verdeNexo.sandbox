// Scripts principales de VerdeNexo

async function register(e) {
  e.preventDefault();

  const nombre = document.getElementById('registerNombre').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  // Validaciones básicas en frontend
  if (!nombre || !email || !password) {
    alert('Por favor completa todos los campos obligatorios');
    return false;
  }

  if (password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres');
    return false;
  }

  try {
    const res = await fetch('http://localhost:3333/api/auth/registro', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      alert('Cuenta creada con éxito. ¡Bienvenido a VerdeNexo!');
      
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      if (modal) modal.hide();
      
      // Actualizar interfaz
      actualizarInterfazUsuario(data.usuario);
      
      // Limpiar formulario
      document.getElementById('registerNombre').value = '';
      document.getElementById('registerEmail').value = '';
      document.getElementById('registerPassword').value = '';
      
    } else {
      alert(`Error: ${data.mensaje}`);
    }
  } catch (error) {
    console.error('Error en el registro:', error);
    alert('Error de conexión. Por favor intenta nuevamente.');
  }

  return false;
}

async function login(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('http://localhost:3333/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await res.json();

    if (res.ok) {
      console.log(' Login exitoso, datos recibidos:', data);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      console.log(' Usuario guardado en localStorage:', data.usuario);
      
      alert('Sesión iniciada correctamente');

      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();

      actualizarInterfazUsuario(data.usuario);

      // Redirigir según el rol
      if (data.usuario.rol === 'admin') {
        console.log(' Redirigiendo a admin...');
        window.location.href = '/admin';
      } else {
        console.log(' Redirigiendo a inicio...');
        window.location.href = '/';
      }

    } else {
      console.log(' Error en login:', data);
      alert(`Error: ${data.mensaje}`);
    }

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    alert('Error en el servidor');
  }

  return false;
}

async function cerrarSesion() {
  try {
    // Mostrar indicador de carga
    const originalText = event.target ? event.target.textContent : '';
    if (event.target) event.target.textContent = 'Cerrando...';

    const response = await fetch('http://localhost:3333/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    // Siempre limpiar localStorage y actualizar interfaz, incluso si el servidor falla
    localStorage.removeItem('usuario');
    
    // Actualizar interfaz inmediatamente
    const botones = document.getElementById('botonesSesion');
    const avatar = document.getElementById('avatarSesion');
    
    if (botones) botones.style.display = 'block';
    if (avatar) avatar.style.display = 'none';

    // Limpiar nombre de usuario
    const userName = document.getElementById('userName');
    const usuarioNombre = document.getElementById('usuarioNombre');
    if (userName) userName.innerText = '';
    if (usuarioNombre) usuarioNombre.textContent = '';

    if (response.ok) {
      alert('Sesión cerrada exitosamente');
    } else {
      alert('Sesión cerrada localmente');
    }
    
    // Redirigir a la página principal
    window.location.href = '/';
    
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    
    // Aún así, cerrar sesión localmente
    localStorage.removeItem('usuario');
    
    const botones = document.getElementById('botonesSesion');
    const avatar = document.getElementById('avatarSesion');
    
    if (botones) botones.style.display = 'block';
    if (avatar) avatar.style.display = 'none';
    
    alert('Sesión cerrada localmente (error de conexión)');
    window.location.href = '/';
  }
}

function actualizarInterfazUsuario(usuario) {
  const botones = document.getElementById('botonesSesion');
  const avatar = document.getElementById('avatarSesion');
  
  if (botones) botones.style.display = 'none';
  if (avatar) avatar.style.display = 'block';
  
  // Establecer nombre del usuario en diferentes elementos
  const userName = document.getElementById('userName');
  if (userName) userName.innerText = usuario.nombre || 'Usuario';
  
  const usuarioNombre = document.getElementById('usuarioNombre');
  if (usuarioNombre) usuarioNombre.textContent = usuario.nombre || 'Usuario';
  
  console.log('✅ Interfaz actualizada para usuario:', usuario.nombre);
}

function actualizarInterfazLogout() {
  // Limpiar localStorage
  localStorage.removeItem('usuario');
  
  // Mostrar botones de login/registro y ocultar avatar
  const botones = document.getElementById('botonesSesion');
  const avatar = document.getElementById('avatarSesion');
  
  if (botones) botones.style.display = 'block';
  if (avatar) avatar.style.display = 'none';
  
  // Limpiar nombres de usuario
  const userName = document.getElementById('userName');
  const usuarioNombre = document.getElementById('usuarioNombre');
  
  if (userName) userName.innerText = '';
  if (usuarioNombre) usuarioNombre.textContent = '';
  
  console.log('✅ Interfaz actualizada para logout');
}

async function verificarAccesoAdmin() {
  try {
    console.log(' Verificando acceso admin...');
    
    // Verificar si hay usuario en localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    console.log(' Usuario en localStorage:', usuario);
    
    if (!usuario) {
      console.log(' No hay usuario en localStorage');
      window.location.replace('/');
      return false;
    }
    
    if (usuario.rol !== 'admin') {
      console.log(' Usuario no es admin. Rol:', usuario.rol);
      window.location.replace('/');
      return false;
    }

    console.log(' Usuario es admin, verificando con servidor...');

    // Verificar con el servidor si el token es válido
    const res = await fetch('http://localhost:3333/api/auth/admin', {
      credentials: 'include'
    });

    console.log(' Respuesta del servidor:', res.status, res.statusText);

    if (res.ok) {
      console.log(' Acceso admin verificado correctamente');
      document.documentElement.style.visibility = 'visible';
      return true;
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.log(' Error del servidor:', errorData);
      localStorage.removeItem('usuario');
      window.location.replace('/');
      return false;
    }
  } catch (error) {
    console.error(' Error al verificar acceso admin:', error);
    localStorage.removeItem('usuario');
    window.location.replace('/');
    return false;
  }
}

// Verificar acceso admin en páginas de administración
if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) {
  document.documentElement.style.visibility = 'hidden';
  verificarAccesoAdmin();
}

// Mostrar panel si hay usuario logueado
document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  
  if (usuario) {
    actualizarInterfazUsuario(usuario);
    
    // Configurar modal de usuario
    const avatarImg = document.getElementById('avatarImg');
    if (avatarImg) {
      avatarImg.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('userPanelModal'));
        modal.show();
      });
    }
  } else {
    // Asegurar que la interfaz esté en estado de logout
    actualizarInterfazLogout();
  }

  // Cargar productos en el slider si estamos en la página de inicio
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    cargarProductosSlider();
  }
});

// Función para cargar productos en el slider
async function cargarProductosSlider() {
  try {
    console.log(' Cargando productos para el slider...');
    const response = await fetch('http://localhost:3333/api/productos');
    console.log(' Respuesta del servidor:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(' Datos recibidos:', data);
    
    // Verificar si data es un array o si tiene una propiedad con el array
    let productos;
    if (Array.isArray(data)) {
      productos = data;
    } else if (data.data && Array.isArray(data.data)) {
      productos = data.data;
    } else if (data.productos && Array.isArray(data.productos)) {
      productos = data.productos;
    } else {
      console.error(' Los datos no son un array válido:', data);
      throw new Error('Formato de datos inválido');
    }
    
    console.log(' Productos procesados:', productos.length, 'productos encontrados');
    
    const listaProductos = document.getElementById('lista-productos');
    if (!listaProductos) {
      console.warn(' Elemento lista-productos no encontrado');
      return;
    }

    if (productos.length === 0) {
      listaProductos.innerHTML = '<p style="text-align: center; color: #ccc; padding: 2rem;">No hay productos disponibles</p>';
      return;
    }

    listaProductos.innerHTML = productos.map(producto => `
      <div class="loom-item">
        <img src="http://localhost:3333/uploads/${producto.imagen}" 
             alt="${producto.nombre}" 
             onerror="this.src='/img/default-product.png'">
        <div style="padding: 1rem 0;">
          <h6 style="color: #fff; margin-bottom: 0.5rem; font-weight: 600;">${producto.nombre}</h6>
          <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 0.8rem;">${producto.descripcion}</p>
          <p style="color: #fff; font-weight: bold; font-size: 1.1rem; margin-bottom: 1rem;">$${producto.precio.toLocaleString()}</p>
          <button class="loom-btn" onclick="agregarAlCarrito('${producto._id}')" style="width: 100%; font-size: 0.8rem;">
            Agregar al carrito
          </button>
        </div>
      </div>
    `).join('');
    
    console.log(' Productos cargados en el slider correctamente');
    
  } catch (error) {
    console.error(' Error al cargar productos:', error);
    const listaProductos = document.getElementById('lista-productos');
    if (listaProductos) {
      listaProductos.innerHTML = `
        <div style="text-align: center; color: #ccc; padding: 2rem;">
          <p>Error al cargar productos</p>
          <button class="loom-btn" onclick="cargarProductosSlider()" style="margin-top: 1rem;">
            Intentar de nuevo
          </button>
        </div>
      `;
    }
  }
}

// Función para agregar al carrito (placeholder)
function agregarAlCarrito(productoId) {
  console.log('Agregando producto al carrito:', productoId);
  alert('Producto agregado al carrito (funcionalidad en desarrollo)');
}

// Función para el slider de productos
function moverSlider(direccion) {
  const slider = document.getElementById("loomSlider");
  if (!slider) {
    console.warn('Slider no encontrado');
    return;
  }

  const items = slider.querySelectorAll(".loom-item");
  if (items.length === 0) {
    console.warn('No hay elementos en el slider');
    return;
  }

  const itemWidth = items[0].offsetWidth + 16; // ancho + gap
  const scrollAmount = direccion * itemWidth * 1; // mover 1 ítem
  
  slider.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  });
}

// Solicitar permiso (placeholder)
function solicitarPermiso() {
  alert('Tu solicitud ha sido enviada. (Aquí va la lógica real luego)');
}

// Subir foto
const formFoto = document.getElementById('formFoto');
if (formFoto) {
  formFoto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('fotoPerfil');
    const formData = new FormData();
    formData.append('foto', fileInput.files[0]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3333/api/usuarios/foto', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        alert('Foto actualizada');
        document.getElementById('avatarImg').src = data.fotoUrl;
      } else {
        alert(`Error: ${data.mensaje}`);
      }
    } catch (error) {
      console.error('Error al subir foto:', error);
      alert('Error en el servidor');
    }
  });
}

// Función para testing de login
function simularLogin() {
  const usuarioTest = {
    id: 'test123',
    nombre: 'Admin Test',
    email: 'admin@test.com',
    rol: 'admin'
  };
  
  console.log(' Simulando login de admin:', usuarioTest);
  localStorage.setItem('usuario', JSON.stringify(usuarioTest));
  
  const botones = document.getElementById('botonesSesion');
  const avatar = document.getElementById('avatarSesion');
  const usuarioNombre = document.getElementById('usuarioNombre');
  
  if (botones) botones.style.display = 'none';
  if (avatar) avatar.style.display = 'block';
  if (usuarioNombre) usuarioNombre.textContent = usuarioTest.nombre;
  
  console.log(' Usuario test simulado:', usuarioTest);
  alert('Usuario de prueba logueado. Ahora puedes intentar ir a /admin');
}

// Función para verificar estado actual
function verificarEstado() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  console.log('🔍 Estado actual:');
  console.log('Usuario en localStorage:', usuario);
  console.log('URL actual:', window.location.href);
  console.log('Pathname:', window.location.pathname);
}

// Función para limpiar estado
function limpiarEstado() {
  localStorage.removeItem('usuario');
  console.log('🧹 Estado limpiado');
  location.reload();
}

// Función para probar la API de productos
async function probarAPI() {
  try {
    console.log('🧪 Probando API de productos...');
    const response = await fetch('http://localhost:3333/api/productos');
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', json);
    } catch (e) {
      console.log('No es JSON válido');
    }
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

// Hacer las funciones disponibles globalmente
window.simularLogin = simularLogin;
window.verificarEstado = verificarEstado;
window.limpiarEstado = limpiarEstado;
window.probarAPI = probarAPI;
window.cerrarSesion = cerrarSesion;
window.register = register;
window.login = login;
window.solicitarPermiso = solicitarPermiso;
window.moverSlider = moverSlider;
window.cargarProductosSlider = cargarProductosSlider;
window.agregarAlCarrito = agregarAlCarrito;
window.actualizarInterfazLogout = actualizarInterfazLogout; // Agregar para debugging

// Log para debugging
console.log(' Scripts de VerdeNexo cargados correctamente');
console.log(' Funciones disponibles en consola:');
console.log('  - simularLogin(): Simula login de admin');
console.log('  - verificarEstado(): Muestra estado actual');
console.log('  - limpiarEstado(): Limpia localStorage y recarga');
console.log('  - probarAPI(): Prueba la conexión con la API de productos');
console.log('  - cargarProductosSlider(): Recarga manualmente los productos');
