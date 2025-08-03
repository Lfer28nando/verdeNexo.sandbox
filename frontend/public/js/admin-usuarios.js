// Función para cargar usuarios
async function cargarUsuarios() {
  try {
    const response = await fetch('http://localhost:3333/api/auth/usuarios', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Error al cargar usuarios');
    }

    const usuarios = await response.json();
    mostrarUsuarios(usuarios);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    mostrarMensajeError('Error al cargar los usuarios registrados');
  }
}

// Función para mostrar usuarios en una tabla
function mostrarUsuarios(usuarios) {
  const contenedor = document.getElementById('contenedor-usuarios');
  
  if (!contenedor) return;

  if (usuarios.length === 0) {
    contenedor.innerHTML = '<p class="text-center text-muted">No hay usuarios registrados.</p>';
    return;
  }

  const tabla = `
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Fecha Registro</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(usuario => `
            <tr>
              <td>${usuario._id}</td>
              <td>${usuario.nombre}</td>
              <td>${usuario.email}</td>
              <td>
                <span class="badge ${usuario.rol === 'admin' ? 'bg-danger' : usuario.rol === 'vendedor' ? 'bg-warning' : 'bg-primary'}">
                  ${usuario.rol}
                </span>
              </td>
              <td>${new Date(usuario.createdAt || Date.now()).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  contenedor.innerHTML = tabla;
}

// Función para mostrar mensajes de error
function mostrarMensajeError(mensaje) {
  const contenedor = document.getElementById('contenedor-usuarios');
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${mensaje}
      </div>
    `;
  }
}

// Cargar usuarios cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  // Solo cargar usuarios si estamos en una página de admin
  if (window.location.pathname.includes('/admin')) {
    cargarUsuarios();
  }
});

// Función para actualizar el contador de usuarios
function actualizarContadorUsuarios(total) {
  const contador = document.getElementById('total-usuarios');
  if (contador) {
    contador.textContent = total;
  }
}

// Exportar funciones para uso global
window.cargarUsuarios = cargarUsuarios;
window.mostrarUsuarios = mostrarUsuarios;
