// Variables globales para el catálogo
let todosLosProductos = [];
let productosFiltrados = [];
let paginaActual = 1;
const productosPorPagina = 12;

// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarProductosCatalogo();
  
  // Event listeners para filtros
  document.querySelectorAll('input[name="categoria"]').forEach(radio => {
    radio.addEventListener('change', aplicarFiltros);
  });
  
  document.querySelectorAll('input[name="precio"]').forEach(radio => {
    radio.addEventListener('change', aplicarFiltros);
  });
  
  document.getElementById('busquedaProducto').addEventListener('input', 
    debounce(aplicarFiltros, 300)
  );
});

// Función para cargar productos desde la API
async function cargarProductosCatalogo() {
  try {
    console.log('🛒 Cargando productos para el catálogo...');
    
    const response = await fetch('http://localhost:3333/api/productos');
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos recibidos:', data);
    
    // Verificar el formato de la respuesta
    if (Array.isArray(data)) {
      todosLosProductos = data;
    } else if (data.data && Array.isArray(data.data)) {
      todosLosProductos = data.data;
    } else if (data.productos && Array.isArray(data.productos)) {
      todosLosProductos = data.productos;
    } else {
      throw new Error('Formato de datos inválido');
    }
    
    console.log('✅ Productos cargados:', todosLosProductos.length);
    
    // Aplicar filtros iniciales (mostrar todos)
    aplicarFiltros();
    
  } catch (error) {
    console.error('❌ Error al cargar productos:', error);
    mostrarError('Error al cargar los productos. Por favor, intenta nuevamente.');
  }
}

// Función para aplicar filtros
function aplicarFiltros() {
  const categoriaSeleccionada = document.querySelector('input[name="categoria"]:checked').value;
  const precioSeleccionado = document.querySelector('input[name="precio"]:checked').value;
  const busqueda = document.getElementById('busquedaProducto').value.toLowerCase().trim();
  const ordenamiento = document.getElementById('ordenar').value;
  
  console.log('🔍 Aplicando filtros:', { categoriaSeleccionada, precioSeleccionado, busqueda, ordenamiento });
  
  // Filtrar productos
  productosFiltrados = todosLosProductos.filter(producto => {
    
    // Filtro por categoría
    let cumpleCategoria = true;
    if (categoriaSeleccionada) {
      cumpleCategoria = producto.categoria && 
        producto.categoria.toLowerCase().includes(categoriaSeleccionada.toLowerCase());
    }
    
    // Filtro por precio
    let cumplePrecio = true;
    if (precioSeleccionado) {
      const [min, max] = precioSeleccionado.split('-').map(Number);
      cumplePrecio = producto.precio >= min && producto.precio <= max;
    }
    
    // Filtro por búsqueda
    let cumpleBusqueda = true;
    if (busqueda) {
      cumpleBusqueda = producto.nombre.toLowerCase().includes(busqueda) ||
                      (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda));
    }
    
    return cumpleCategoria && cumplePrecio && cumpleBusqueda;
  });
  
  // Ordenar productos
  if (ordenamiento) {
    productosFiltrados.sort((a, b) => {
      switch (ordenamiento) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre);
        case 'precio-asc':
          return a.precio - b.precio;
        case 'precio-desc':
          return b.precio - a.precio;
        default:
          return 0;
      }
    });
  }
  
  console.log('✅ Productos filtrados:', productosFiltrados.length);
  
  // Resetear paginación
  paginaActual = 1;
  
  // Mostrar productos
  mostrarProductos();
  actualizarContador();
  generarPaginacion();
}

// Función para mostrar productos en el grid
function mostrarProductos() {
  const grid = document.getElementById('grid-productos');
  
  if (productosFiltrados.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fas fa-seedling" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
        <h4 class="text-muted">No se encontraron productos</h4>
        <p class="text-muted">Intenta con otros filtros de búsqueda</p>
        <button class="loom-btn" onclick="limpiarFiltros()">Limpiar filtros</button>
      </div>
    `;
    return;
  }
  
  // Calcular productos para la página actual
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosEnPagina = productosFiltrados.slice(inicio, fin);
  
  grid.innerHTML = productosEnPagina.map(producto => `
    <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
      <div class="loom-catalog-item" style="cursor: pointer;" onclick="mostrarDetalleProducto('${producto._id}')">
        <img src="http://localhost:3333/uploads/${producto.imagen}" 
             alt="${producto.nombre}" 
             onerror="this.src='/img/default-product.png'">
        <div class="card-content">
          <h6 class="card-title">
            ${producto.nombre}
          </h6>
          <p class="card-description">
            ${producto.descripcion ? (producto.descripcion.length > 80 ? 
              producto.descripcion.substring(0, 80) + '...' : 
              producto.descripcion) : 'Sin descripción'}
          </p>
          <div class="card-footer">
            <p class="card-price">
              $${producto.precio.toLocaleString()}
            </p>
            ${producto.categoria ? `<span class="card-category">${producto.categoria}</span>` : ''}
          </div>
          <button class="loom-btn" onclick="event.stopPropagation(); agregarAlCarrito('${producto._id}')" 
                  type="button">
            <i class="fas fa-cart-plus me-2"></i>Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Función para mostrar detalle del producto en modal
async function mostrarDetalleProducto(productoId) {
  try {
    const producto = todosLosProductos.find(p => p._id === productoId);
    
    if (!producto) {
      console.error('Producto no encontrado');
      return;
    }
    
    document.getElementById('modalProductoLabel').textContent = producto.nombre;
    
    document.getElementById('modal-contenido').innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <img src="http://localhost:3333/uploads/${producto.imagen}" 
               alt="${producto.nombre}" 
               class="img-fluid rounded"
               onerror="this.src='/img/default-product.png'"
               style="width: 100%; max-height: 400px; object-fit: cover;">
        </div>
        <div class="col-md-6">
          <h4 class="mb-3">${producto.nombre}</h4>
          <h5 class="text-success mb-3">$${producto.precio.toLocaleString()}</h5>
          
          ${producto.categoria ? `
            <p><strong>Categoría:</strong> 
              <span class="badge bg-secondary">${producto.categoria}</span>
            </p>
          ` : ''}
          
          <p><strong>Descripción:</strong></p>
          <p class="text-muted">${producto.descripcion || 'Sin descripción disponible'}</p>
          
          <div class="mt-4">
            <h6>Características:</h6>
            <ul class="list-unstyled">
              <li><i class="fas fa-check text-success me-2"></i>Planta de alta calidad</li>
              <li><i class="fas fa-check text-success me-2"></i>Cuidados incluidos</li>
              <li><i class="fas fa-check text-success me-2"></i>Garantía de satisfacción</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    // Configurar botón del modal
    document.getElementById('btn-agregar-modal').onclick = () => {
      agregarAlCarrito(productoId);
      bootstrap.Modal.getInstance(document.getElementById('modalProducto')).hide();
    };
    
    // Mostrar modal
    new bootstrap.Modal(document.getElementById('modalProducto')).show();
    
  } catch (error) {
    console.error('Error al mostrar detalle:', error);
  }
}

// Función para limpiar filtros
function limpiarFiltros() {
  document.querySelector('input[name="categoria"][value=""]').checked = true;
  document.querySelector('input[name="precio"][value=""]').checked = true;
  document.getElementById('busquedaProducto').value = '';
  document.getElementById('ordenar').value = '';
  
  aplicarFiltros();
}

// Función para actualizar contador de productos
function actualizarContador() {
  const contador = document.getElementById('contador-productos');
  const total = productosFiltrados.length;
  
  if (total === 0) {
    contador.textContent = 'No se encontraron productos';
  } else if (total === 1) {
    contador.textContent = '1 producto encontrado';
  } else {
    contador.textContent = `${total} productos encontrados`;
  }
}

// Función para generar paginación
function generarPaginacion() {
  const paginacion = document.getElementById('paginacion');
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  
  if (totalPaginas <= 1) {
    paginacion.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Botón anterior
  html += `
    <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1})">Anterior</a>
    </li>
  `;
  
  // Números de página
  for (let i = 1; i <= totalPaginas; i++) {
    if (i === paginaActual || i === 1 || i === totalPaginas || 
        (i >= paginaActual - 1 && i <= paginaActual + 1)) {
      html += `
        <li class="page-item ${i === paginaActual ? 'active' : ''}">
          <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
        </li>
      `;
    } else if (i === paginaActual - 2 || i === paginaActual + 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  // Botón siguiente
  html += `
    <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1})">Siguiente</a>
    </li>
  `;
  
  paginacion.innerHTML = html;
}

// Función para cambiar página
function cambiarPagina(nuevaPagina) {
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  
  paginaActual = nuevaPagina;
  mostrarProductos();
  generarPaginacion();
  
  // Scroll suave hacia arriba
  document.querySelector('#grid-productos').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
}

// Función para mostrar errores
function mostrarError(mensaje) {
  const grid = document.getElementById('grid-productos');
  grid.innerHTML = `
    <div class="col-12 text-center py-5">
      <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem; margin-bottom: 1rem;"></i>
      <h4 class="text-muted">Error</h4>
      <p class="text-muted">${mensaje}</p>
      <button class="loom-btn" onclick="cargarProductosCatalogo()">Reintentar</button>
    </div>
  `;
}

// Función debounce para búsqueda
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Hacer funciones disponibles globalmente
window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;
window.mostrarDetalleProducto = mostrarDetalleProducto;
window.cambiarPagina = cambiarPagina;
window.cargarProductosCatalogo = cargarProductosCatalogo;

console.log('🛍️ Script del catálogo cargado correctamente');
