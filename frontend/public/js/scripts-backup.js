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
      credentials: 'include' // Para enviar cookies
    });

    const data = await res.json();

    if (res.ok) {
      // 💾 Guarda usuario inmediatamente
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      alert('Sesión iniciada correctamente');

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();

      // Mostrar panel sin esperar al reload
      const botones = document.getElementById('botonesSesion');
      const avatar = document.getElementById('avatarSesion');
      botones.style.display = 'none';
      avatar.style.display = 'block';
      
      // Establecer nombre del usuario en diferentes elementos
      const userName = document.getElementById('userName');
      if (userName) userName.innerText = data.usuario.nombre;
      
      const usuarioNombre = document.getElementById('usuarioNombre');
      if (usuarioNombre) usuarioNombre.textContent = data.usuario.nombre;

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
      // Limpiar localStorage
      localStorage.removeItem('usuario');
      
      // Ocultar avatar y mostrar botones de sesión
      const botones = document.getElementById('botonesSesion');
      const avatar = document.getElementById('avatarSesion');
      
      if (botones) botones.style.display = 'block';
      if (avatar) avatar.style.display = 'none';

      // Mostrar mensaje y redirigir
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

 async function verificarAccesoAdmin() {
    try {
      // Verificar si hay usuario en localStorage
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      
      if (!usuario || usuario.rol !== 'admin') {
        // Si no hay usuario o no es admin, redirigir
        window.location.replace('/');
        return false;
      }

      // Verificar con el servidor si el token es válido
      const res = await fetch('http://localhost:3333/api/auth/admin', {
        credentials: 'include'
      });

      if (res.ok) {
        // ✅ Mostrar la página
        document.documentElement.style.visibility = 'visible';
        return true;
      } else {
        // ❌ Usuario no autorizado, limpiar localStorage y redirigir
        localStorage.removeItem('usuario');
        window.location.replace('/');
        return false;
      }
    } catch (error) {
      // ❌ Error al verificar, limpiar localStorage y redirigir
      localStorage.removeItem('usuario');
      window.location.replace('/');
      return false;
    }
  }

  // Verificar acceso admin en páginas de administración
  if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) {
    // Ocultar la página inicialmente para evitar parpadeo
    document.documentElement.style.visibility = 'hidden';
    verificarAccesoAdmin();
  }


  // Llamar inmediatamente al cargar la vista

// Mostrar panel si hay usuario logueado
document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const panel = document.getElementById('userPanel');
  const botones = document.getElementById('botonesSesion');
  const avatar = document.getElementById('avatarSesion');

  if (usuario) {
    if (botones) botones.style.display = 'none';
    if (avatar) avatar.style.display = 'block';
    
    // Establecer nombre del usuario en el dropdown
    const usuarioNombre = document.getElementById('usuarioNombre');
    if (usuarioNombre) {
      usuarioNombre.textContent = usuario.nombre || 'Usuario';
    }

    const userName = document.getElementById('userName');
    if (userName) {
      userName.innerText = usuario.nombre || 'Usuario';
    }

    document.getElementById('avatarImg')?.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('userPanelModal'));
      modal.show();
    });

  } else {
    if (botones) botones.style.display = 'block';
    if (avatar) avatar.style.display = 'none';
  }
});



// Solicitar permiso (placeholder por ahora)
function solicitarPermiso() {
  alert('Tu solicitud ha sido enviada. (Aquí va la lógica real luego)');
}

// Subir foto
document.getElementById('formFoto')?.addEventListener('submit', async (e) => {
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
    alert(data.mensaje || 'Foto subida');
  } catch (err) {
    alert('Error al subir la foto');
  }
});


  const formulario = document.querySelector("form");
  const cuerpoTabla = document.querySelector("table tbody");
  
  let productoEditando = null;
  
  let elementoEditando = null;

  document.addEventListener("DOMContentLoaded", () => {
    const formularios = document.querySelectorAll("form");
  
  // Gestión de formularios dinámicos
  document.addEventListener("DOMContentLoaded", () => {
    const formularios = document.querySelectorAll("form");
    let elementoEditando = null;

    formularios.forEach(formulario => {
      formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
  
        const inputs = this.querySelectorAll("input, select");
        const valores = Array.from(inputs).map(input => input.value);
        
        // Buscar la tabla correspondiente en la misma sección
        const seccion = this.closest(".seccion");
        const tabla = seccion ? seccion.querySelector("table tbody") : null;

        if (elementoEditando) {
          for (let i = 1; i < valores.length + 1; i++) {
            elementoEditando.children[i].textContent = valores[i - 1];
          }
          elementoEditando = null;
          alert("Datos actualizados correctamente ");
        } else if (tabla) {
          const nuevaFila = document.createElement("tr");
          let celdas = `<td>#</td>`;
          valores.forEach(valor => {
            celdas += `<td>${valor}</td>`;
          });
          celdas += `
            <td>
              <button class="btn btn-sm btn-info">Ver</button>
              <button class="btn btn-sm btn-warning">Editar</button>
              <button class="btn btn-sm btn-danger">Eliminar</button>
            </td>`;
          nuevaFila.innerHTML = celdas;
          tabla.appendChild(nuevaFila);
          alert("Registro exitoso ");
        }
  
        this.reset();
      });
    });
    
    const secciones = document.querySelectorAll(".seccion");
  
    secciones.forEach(seccion => {
      const tabla = seccion.querySelector("table");
      if (!tabla) return;
  
      tabla.addEventListener("click", (evento) => {
        const boton = evento.target;
        const fila = boton.closest("tr");
        const celdas = fila.querySelectorAll("td");
  
        if (boton.classList.contains("btn-info")) {
          let mensaje = "";
          for (let i = 1; i < celdas.length - 1; i++) {
            mensaje += `${celdas[i].textContent}\n`;
          }
          alert("Detalles:\n" + mensaje);
        }
  
        if (boton.classList.contains("btn-warning")) {
          const formulario = seccion.querySelector("form");
          const campos = formulario.querySelectorAll("input, select");
  
          campos.forEach((campo, i) => {
            campo.value = celdas[i + 1].textContent;
          });
  
          elementoEditando = fila;
        }
  
        if (boton.classList.contains("btn-danger")) {
          if (confirm("¿Deseas eliminar este registro?")) {
            fila.remove();
          }
        }
      });
    });
  }); // Cierre de DOMContentLoaded

function moverSlider(direccion) {
  const slider = document.getElementById("loomSlider");
  const itemWidth = slider.querySelector(".loom-item").offsetWidth + 16; // ancho + gap
  slider.scrollLeft += direccion * itemWidth * 1; // mover 1 ítems
}

// Función temporal para testing - simular usuario logueado
function simularLogin() {
  const usuarioTest = {
    id: 'test123',
    nombre: 'Admin Test',
    email: 'admin@test.com',
    rol: 'admin'
  };
  
  localStorage.setItem('usuario', JSON.stringify(usuarioTest));
  
  // Mostrar avatar y ocultar botones
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

// Log para debugging
console.log('🚀 Scripts de VerdeNexo cargados correctamente');
console.log('💡 Para probar el logout, ejecuta: simularLogin() en la consola');