// Scripts principales de VerdeNexo

async function register(e) {
  e.preventDefault();

  const nombre = document.getElementById('registerNombre').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

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
      alert('Cuenta creada con éxito');
      const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      modal.hide();
      actualizarInterfazUsuario(data.usuario);
    } else {
      alert(`Error: ${data.mensaje}`);
    }
  } catch (error) {
    console.error('Error en el registro:', error);
    alert('Error en el servidor');
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
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      alert('Sesión iniciada correctamente');

      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();

      actualizarInterfazUsuario(data.usuario);

      // Redirigir según el rol
      if (data.usuario.rol === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }

    } else {
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
    const response = await fetch('http://localhost:3333/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      localStorage.removeItem('usuario');
      
      const botones = document.getElementById('botonesSesion');
      const avatar = document.getElementById('avatarSesion');
      
      if (botones) botones.style.display = 'block';
      if (avatar) avatar.style.display = 'none';

      alert('Sesión cerrada exitosamente');
      window.location.href = '/';
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    alert('No se pudo cerrar la sesión. Intenta nuevamente.');
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
}

async function verificarAccesoAdmin() {
  try {
    // Verificar si hay usuario en localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuario || usuario.rol !== 'admin') {
      window.location.replace('/');
      return false;
    }

    // Verificar con el servidor si el token es válido
    const res = await fetch('http://localhost:3333/api/auth/admin', {
      credentials: 'include'
    });

    if (res.ok) {
      document.documentElement.style.visibility = 'visible';
      return true;
    } else {
      localStorage.removeItem('usuario');
      window.location.replace('/');
      return false;
    }
  } catch (error) {
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
    const botones = document.getElementById('botonesSesion');
    const avatar = document.getElementById('avatarSesion');
    
    if (botones) botones.style.display = 'block';
    if (avatar) avatar.style.display = 'none';
  }
});

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
  
  localStorage.setItem('usuario', JSON.stringify(usuarioTest));
  
  const botones = document.getElementById('botonesSesion');
  const avatar = document.getElementById('avatarSesion');
  const usuarioNombre = document.getElementById('usuarioNombre');
  
  if (botones) botones.style.display = 'none';
  if (avatar) avatar.style.display = 'block';
  if (usuarioNombre) usuarioNombre.textContent = usuarioTest.nombre;
  
  console.log('✅ Usuario test simulado:', usuarioTest);
  alert('Usuario de prueba logueado. Ahora puedes probar el botón de cerrar sesión.');
}

// Hacer las funciones disponibles globalmente
window.simularLogin = simularLogin;
window.cerrarSesion = cerrarSesion;
window.register = register;
window.login = login;
window.solicitarPermiso = solicitarPermiso;

// Log para debugging
console.log('🚀 Scripts de VerdeNexo cargados correctamente');
console.log('💡 Para probar el logout, ejecuta: simularLogin() en la consola');
