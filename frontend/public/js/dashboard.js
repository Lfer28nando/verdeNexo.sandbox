// dashboard.js

function mostrarVista(id) {
  document.querySelectorAll('.vista-dashboard').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.sidebar-jesska nav a').forEach(a => a.classList.remove('active'));
  document.querySelector(`.sidebar-jesska nav a[onclick*="${id}"]`)?.classList.add('active');
}

function cargarTotales() {
  const productos = JSON.parse(localStorage.getItem("datos_formProducto")) || [];
  const clientes = JSON.parse(localStorage.getItem("datos_formCliente")) || [];
  const vendedores = JSON.parse(localStorage.getItem("datos_formVendedor")) || [];

  document.getElementById("sumProductos").textContent = productos.length;
  document.getElementById("sumClientes").textContent = clientes.length;
  document.getElementById("sumVendedores").textContent = vendedores.length;
}

function crearFormHandlers({ formId, listaId, campos, imagenId }) {
  const form = document.getElementById(formId);
  const lista = document.getElementById(listaId);
  const storageKey = `datos_${formId}`;
  const inputImagen = form.querySelector('input[type="file"]');
  const preview = document.getElementById(imagenId);
  let datos = JSON.parse(localStorage.getItem(storageKey)) || [];

  inputImagen?.addEventListener('change', () => {
    const file = inputImagen.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => preview.src = e.target.result;
      reader.readAsDataURL(file);
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const nuevo = {};
    campos.forEach(c => nuevo[c] = form[c].value);
    nuevo.imagen = preview?.src || "";
    datos.push(nuevo);
    guardar();
    render();
    form.reset();
    if (preview) preview.src = "";
  });

  function guardar() {
    localStorage.setItem(storageKey, JSON.stringify(datos));
    cargarTotales();
  }

  function render() {
    lista.innerHTML = "";
    datos.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "card p-3 mb-2";
      div.innerHTML = `
        ${item.imagen ? `<img src="${item.imagen}" alt="img" class="img-thumbnail mb-2" style="max-width: 80px">` : ''}
        <h6>${item.nombre}</h6>
        ${item.precio ? `<p class='text-muted'>$${item.precio}</p>` : ''}
        ${item.correo ? `<p class='text-muted'>${item.correo}</p>` : ''}
        <div class="btn-group">
          <button class="btn btn-outline-primary btn-sm" onclick="editar_${formId}(${i})">Editar</button>
          <button class="btn btn-outline-danger btn-sm" onclick="eliminar_${formId}(${i})">Eliminar</button>
        </div>`;
      lista.appendChild(div);
    });
  }

  window[`eliminar_${formId}`] = i => {
    datos.splice(i, 1);
    guardar();
    render();
  };

  window[`editar_${formId}`] = i => {
    const item = datos[i];
    campos.forEach(c => form[c].value = item[c]);
    if (preview && item.imagen) preview.src = item.imagen;
    datos.splice(i, 1);
    guardar();
    render();
  };

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  mostrarVista("inicio");
  cargarTotales();

  crearFormHandlers({
    formId: "formProducto",
    listaId: "listaProductos",
    campos: ["nombre", "precio"],
    imagenId: "previewProducto"
  });

  crearFormHandlers({
    formId: "formCliente",
    listaId: "listaClientes",
    campos: ["nombre", "correo"],
    imagenId: "previewCliente"
  });

  crearFormHandlers({
    formId: "formVendedor",
    listaId: "listaVendedores",
    campos: ["nombre", "correo"],
    imagenId: "previewVendedor"
  });
});
