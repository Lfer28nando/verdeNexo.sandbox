// Configuración de la API
const API_BASE_URL = 'http://localhost:3333/api';
const UPLOADS_URL = 'http://localhost:3333/uploads';

// Variables globales
let productos = [];
let productoActual = null;

// Función para obtener o crear un token de demo
async function obtenerTokenDemo() {
    // Primero intentar hacer login con credenciales de demo
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email: 'admin@demo.com',
                password: 'admin123'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.usuario && data.usuario.rol === 'admin') {
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                return true; // Token se guardó en cookies
            }
        }
    } catch (error) {
        console.log('Login de demo falló, usando token temporal');
    }
    
    // Si el login falla, crear usuario demo en localStorage
    const usuarioDemo = {
        id: 'admin-demo',
        nombre: 'Admin Demo',
        email: 'admin@demo.com',
        rol: 'admin'
    };
    localStorage.setItem('usuario', JSON.stringify(usuarioDemo));
    return false; // Usando datos locales
}

// Elementos del DOM
const tablaProductos = document.getElementById('tablaProductos');
const formProducto = document.getElementById('formProducto');
const modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));
const modalEliminar = new bootstrap.Modal(document.getElementById('modalEliminar'));
const toast = new bootstrap.Toast(document.getElementById('toast'));
const buscarProducto = document.getElementById('buscarProducto');
const filtroDisponibilidad = document.getElementById('filtroDisponibilidad');
const btnRefrescar = document.getElementById('btnRefrescar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
const imagenInput = document.getElementById('imagen');
const vistaPrevia = document.getElementById('vistaPrevia');
const imagenPrevia = document.getElementById('imagenPrevia');

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    // Primero intentar obtener token de demo
    await obtenerTokenDemo();
    
    // Luego cargar productos y configurar eventos
    cargarProductos();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    // Formulario de producto
    formProducto.addEventListener('submit', guardarProducto);
    
    // Búsqueda y filtros
    buscarProducto.addEventListener('input', filtrarProductos);
    filtroDisponibilidad.addEventListener('change', filtrarProductos);
    btnRefrescar.addEventListener('click', cargarProductos);
    
    // Confirmación de eliminación
    btnConfirmarEliminar.addEventListener('click', confirmarEliminacion);
    
    // Vista previa de imagen
    imagenInput.addEventListener('change', mostrarVistaPrevia);
    
    // Limpiar formulario al cerrar modal
    document.getElementById('modalProducto').addEventListener('hidden.bs.modal', limpiarFormulario);
}

// Cargar productos desde la API
async function cargarProductos() {
    try {
        mostrarCargando(true);
        
        const response = await fetch(`${API_BASE_URL}/productos`);
        
        // Verificar si la respuesta es JSON válida
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('El servidor no está respondiendo correctamente. Verifica que el backend esté funcionando.');
        }
        
        const data = await response.json();
        
        if (data.success) {
            productos = data.data;
            mostrarProductos(productos);
        } else {
            mostrarNotificacion('Error al cargar productos', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        
        // Mostrar mensaje específico según el tipo de error
        if (error.message.includes('JSON')) {
            mostrarNotificacion('Error del servidor', 'El backend no está respondiendo correctamente. Verifica que esté ejecutándose.', 'error');
        } else {
            mostrarNotificacion('Error de conexión', 'No se pudo conectar con el servidor', 'error');
        }
        
        // Mostrar mensaje sin productos si no se pudieron cargar
        productos = [];
        mostrarProductos(productos);
    } finally {
        mostrarCargando(false);
    }
}

// Mostrar productos en la tabla
function mostrarProductos(productosArray) {
    const tbody = tablaProductos;
    const mensajeSinProductos = document.getElementById('mensajeSinProductos');
    
    if (productosArray.length === 0) {
        tbody.innerHTML = '';
        mensajeSinProductos.classList.remove('d-none');
        return;
    }
    
    mensajeSinProductos.classList.add('d-none');
    
    tbody.innerHTML = productosArray.map(producto => `
        <tr class="fade-in">
            <td>
                ${producto.imagen ? 
                    `<img src="${UPLOADS_URL}/${encodeURIComponent(producto.imagen)}" 
                          alt="${producto.nombre}" 
                          class="producto-imagen">` 
                    : '<div class="producto-imagen-placeholder"><i class="fas fa-image"></i></div>'
                }
            </td>
            <td>
                <strong>${escapeHtml(producto.nombre)}</strong>
            </td>
            <td>
                <span class="precio-producto">$${formatearPrecio(producto.precio)}</span>
            </td>
            <td>
                <span class="badge ${producto.disponibilidad ? 'badge-disponible' : 'badge-no-disponible'}">
                    <i class="fas ${producto.disponibilidad ? 'fa-check' : 'fa-times'} me-1"></i>
                    ${producto.disponibilidad ? 'Disponible' : 'No disponible'}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-primary btn-action" 
                            onclick="editarProducto('${producto._id}')" 
                            title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-action" 
                            onclick="eliminarProducto('${producto._id}')" 
                            title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filtrar productos
function filtrarProductos() {
    const busqueda = buscarProducto.value.toLowerCase();
    const disponibilidad = filtroDisponibilidad.value;
    
    const productosFiltrados = productos.filter(producto => {
        const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda);
        const coincideDisponibilidad = disponibilidad === '' || 
                                      producto.disponibilidad.toString() === disponibilidad;
        
        return coincideBusqueda && coincideDisponibilidad;
    });
    
    mostrarProductos(productosFiltrados);
}

// Guardar producto (crear o actualizar)
async function guardarProducto(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(formProducto);
        const productoId = document.getElementById('productoId').value;
        
        // Validaciones del lado del cliente
        if (!validarFormulario()) {
            return;
        }
        
        const url = productoId ? 
            `${API_BASE_URL}/productos/${productoId}` : 
            `${API_BASE_URL}/productos`;
        
        const method = productoId ? 'PUT' : 'POST';
        
        // Usar credentials: 'include' para enviar cookies automáticamente
        const response = await fetch(url, {
            method: method,
            credentials: 'include', // Esto envía las cookies automáticamente
            body: formData
        });
        
        // Verificar si la respuesta es JSON válida
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('El servidor respondió con un error. Verifica que tengas permisos de administrador.');
        }
        
        const data = await response.json();
        
        if (data.success) {
            modalProducto.hide();
            cargarProductos();
            mostrarNotificacion(
                'Éxito', 
                productoId ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 
                'success'
            );
        } else {
            mostrarNotificacion('Error', data.message || 'Error desconocido', 'error');
        }
    } catch (error) {
        console.error('Error al guardar producto:', error);
        
        if (error.message.includes('JSON')) {
            mostrarNotificacion('Error de autenticación', 'No tienes permisos para realizar esta acción. Verifica que estés logueado como administrador.', 'error');
        } else {
            mostrarNotificacion('Error de conexión', 'No se pudo guardar el producto', 'error');
        }
    }
}

// Editar producto
function editarProducto(id) {
    const producto = productos.find(p => p._id === id);
    if (!producto) return;
    
    productoActual = producto;
    
    // Llenar el formulario con los datos del producto
    document.getElementById('productoId').value = producto._id;
    document.getElementById('nombre').value = producto.nombre;
    document.getElementById('precio').value = producto.precio;
    document.getElementById('disponibilidad').value = producto.disponibilidad.toString();
    
    // Mostrar imagen actual si existe
    if (producto.imagen) {
        vistaPrevia.classList.remove('d-none');
        imagenPrevia.src = `${UPLOADS_URL}/${encodeURIComponent(producto.imagen)}`;
    }
    
    // Cambiar título del modal
    document.getElementById('modalProductoLabel').textContent = 'Editar Producto';
    document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
    
    modalProducto.show();
}

// Eliminar producto
function eliminarProducto(id) {
    const producto = productos.find(p => p._id === id);
    if (!producto) return;
    
    productoActual = producto;
    modalEliminar.show();
}

// Confirmar eliminación
async function confirmarEliminacion() {
    if (!productoActual) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/productos/${productoActual._id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            modalEliminar.hide();
            cargarProductos();
            mostrarNotificacion('Éxito', 'Producto eliminado correctamente', 'success');
        } else {
            mostrarNotificacion('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        mostrarNotificacion('Error de conexión', 'No se pudo eliminar el producto', 'error');
    }
    
    productoActual = null;
}

// Limpiar formulario
function limpiarFormulario() {
    formProducto.reset();
    document.getElementById('productoId').value = '';
    vistaPrevia.classList.add('d-none');
    imagenPrevia.src = '';
    
    // Restaurar título del modal
    document.getElementById('modalProductoLabel').textContent = 'Agregar Producto';
    document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-save"></i> Guardar Producto';
    
    // Limpiar validaciones
    formProducto.classList.remove('was-validated');
    const inputs = formProducto.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
    
    productoActual = null;
}

// Mostrar vista previa de imagen
function mostrarVistaPrevia(event) {
    const file = event.target.files[0];
    if (!file) {
        vistaPrevia.classList.add('d-none');
        return;
    }
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        mostrarNotificacion('Error', 'Por favor selecciona un archivo de imagen válido', 'error');
        event.target.value = '';
        return;
    }
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
        mostrarNotificacion('Error', 'La imagen no puede superar los 5MB', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imagenPrevia.src = e.target.result;
        vistaPrevia.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
}

// Validar formulario
function validarFormulario() {
    const nombre = document.getElementById('nombre').value.trim();
    const precio = document.getElementById('precio').value;
    
    let esValido = true;
    
    // Validar nombre
    if (nombre.length < 3 || nombre.length > 50) {
        document.getElementById('nombre').classList.add('is-invalid');
        esValido = false;
    } else {
        document.getElementById('nombre').classList.remove('is-invalid');
        document.getElementById('nombre').classList.add('is-valid');
    }
    
    // Validar precio
    if (!precio || parseFloat(precio) < 0) {
        document.getElementById('precio').classList.add('is-invalid');
        esValido = false;
    } else {
        document.getElementById('precio').classList.remove('is-invalid');
        document.getElementById('precio').classList.add('is-valid');
    }
    
    return esValido;
}

// Mostrar indicador de carga
function mostrarCargando(mostrar) {
    const tbody = tablaProductos;
    if (mostrar) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <div class="mt-2 text-muted">Cargando productos...</div>
                </td>
            </tr>
        `;
    }
}

// Mostrar notificaciones
function mostrarNotificacion(titulo, mensaje, tipo = 'info') {
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    const toastElement = document.getElementById('toast');
    
    toastTitle.textContent = titulo;
    toastMessage.textContent = mensaje;
    
    // Configurar icono y color según el tipo
    toastElement.className = 'toast';
    switch (tipo) {
        case 'success':
            toastIcon.className = 'fas fa-check-circle me-2 text-success';
            toastElement.classList.add('border-success');
            break;
        case 'error':
            toastIcon.className = 'fas fa-exclamation-circle me-2 text-danger';
            toastElement.classList.add('border-danger');
            break;
        case 'warning':
            toastIcon.className = 'fas fa-exclamation-triangle me-2 text-warning';
            toastElement.classList.add('border-warning');
            break;
        default:
            toastIcon.className = 'fas fa-info-circle me-2 text-info';
            toastElement.classList.add('border-info');
    }
    
    toast.show();
}

// Funciones utilitarias
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO').format(precio);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
