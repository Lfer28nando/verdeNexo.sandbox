let carrito = JSON.parse(localStorage.getItem("carritoloom")) || [];

function agregarAlCarrito(nombre, precio) {
  carrito.push({ nombre, precio });
  localStorage.setItem("carritoloom", JSON.stringify(carrito));
  actualizarContadorCarrito();
  renderizarCarritoDropdown();
}

function actualizarContadorCarrito() {
  const contador = document.getElementById("carrito-contador");
  if (contador) contador.textContent = carrito.length;
}

function renderizarCarritoDropdown() {
  const lista = document.getElementById("carrito-lista");
  const total = document.getElementById("carrito-total");
  if (!lista || !total) return;

  lista.innerHTML = "";
  let suma = 0;

  if (carrito.length === 0) {
    lista.innerHTML = "<small class='text-muted'>Tu carrito está vacío.</small>";
    total.textContent = "";
    return;
  }

  carrito.forEach(item => {
    const li = document.createElement("div");
    li.className = "d-flex justify-content-between small mb-1";
    li.innerHTML = `<span>${item.nombre}</span><span>$${item.precio.toLocaleString()}</span>`;
    lista.appendChild(li);
    suma += item.precio;
  });

  total.textContent = `Total: $${suma.toLocaleString()}`;
}

function vaciarCarrito() {
  carrito = [];
  localStorage.setItem("carritoloom", JSON.stringify(carrito));
  actualizarContadorCarrito();
  renderizarCarritoDropdown();
}

document.addEventListener("DOMContentLoaded", () => {
  actualizarContadorCarrito();
  renderizarCarritoDropdown();
});
