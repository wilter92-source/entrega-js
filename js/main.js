document.addEventListener("DOMContentLoaded", () => {
  // Estado principal de la app.
  let productosGlobales = [];
  let carrito = JSON.parse(localStorage.getItem("skinmatchCarrito")) || [];
  let toastActivo = null;

  // No se borra el carrito al recargar la página.
  function guardarCarrito() {
    localStorage.setItem("skinmatchCarrito", JSON.stringify(carrito));
  }

  const abrirCarrito = document.getElementById("abrir-carrito");
  const cerrarCarrito = document.getElementById("cerrar-carrito");
  const carritoOverlay = document.getElementById("carrito-overlay");
  const carritoDrawer = document.getElementById("carrito-drawer");
  const btnVaciarCarrito = document.getElementById("vaciar-carrito");
  const btnFinalizar = document.getElementById("finalizar-compra");

  // Unifico estilo visual de los modales de SweetAlert.
  const sweetAlertConfig = {
    buttonsStyling: false,
    background: "#F3E4DC",
    color: "#485C45",
    customClass: {
      icon: "swal-icon-custom",
      confirmButton: "swal-button swal-button--confirm",
      cancelButton: "swal-button swal-button--cancel"
    }
  };

  // Muestra una sola notificación Toastify a la vez.
  function mostrarToast(mensaje, tipo = "success") {
    if (toastActivo && typeof toastActivo.hideToast === "function") {
      toastActivo.hideToast();
    }

    const estilos = tipo === "success"
      ? { background: "rgba(72, 92, 69, 0.92)", color: "#FFFFFF" }
      : { background: "#263024", color: "#FFFFFF" };

    toastActivo = Toastify({
      text: mensaje,
      duration: 2200,
      gravity: "top",
      position: "right",
      offset: {
        x: 24,
        y: 88
      },
      stopOnFocus: false,
      style: estilos
    });

    toastActivo.showToast();
  }

  // El drawer lateral del carrito.
  function abrirDrawerCarrito() {
    carritoDrawer.classList.add("activo");
    carritoOverlay.classList.add("activo");
  }

  function cerrarDrawerCarrito() {
    carritoDrawer.classList.remove("activo");
    carritoOverlay.classList.remove("activo");
  }

  if (abrirCarrito) abrirCarrito.addEventListener("click", abrirDrawerCarrito);
  if (cerrarCarrito) cerrarCarrito.addEventListener("click", cerrarDrawerCarrito);
  if (carritoOverlay) carritoOverlay.addEventListener("click", cerrarDrawerCarrito);

  // Cargo los productos desde el JSON.
  fetch("db/data.json")
    .then(res => res.json())
    .then(productos => {
      productosGlobales = productos;
      mostrarProductos(productosGlobales);
      mostrarCarrito();
    })
    .catch(() => {
      mostrarToast("No se pudieron cargar los productos", "error");
    });

  // Renderiza las cards de productos en el DOM.
  function mostrarProductos(productos) {
    const contenedor = document.getElementById("productos-contenedor");
    contenedor.innerHTML = "";

    productos.forEach(producto => {
      const card = document.createElement("article");
      card.classList.add("producto-card");
      card.innerHTML = `
        <div class="producto-card__image">
          <img src="${producto.imagen}" alt="${producto.nombre}">
        </div>
        <div class="producto-card__content">
          <span class="producto-card__tag">${producto.paso}</span>
          <h3>${producto.nombre}</h3>
          <p>${producto.descripcion}</p>
          <div class="producto-card__footer">
            <strong>$${producto.precio}</strong>
            <button type="button" onclick="agregarAlCarrito(${producto.id})">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Agregar a rutina
            </button>
          </div>
        </div>
      `;
      contenedor.appendChild(card);
    });
  }

  // Filtro productos según el tipo de piel elegido.
  const botonesPiel = document.querySelectorAll("#selector-piel button");
  botonesPiel.forEach(boton => {
    boton.addEventListener("click", () => {
      const tipo = boton.dataset.piel;

      if (tipo === "todas") {
        mostrarProductos(productosGlobales);
      } else {
        const productosFiltrados = productosGlobales.filter(producto => producto.tipoPiel === tipo);
        mostrarProductos(productosFiltrados);
      }
    });
  });

  // Agrego productos al carrito.
  window.agregarAlCarrito = function(productoId) {
    const producto = productosGlobales.find(producto => producto.id === productoId);
    if (!producto) return;

    const item = carrito.find(producto => producto.id === productoId);

    if (item) {
      item.cantidad += 1;
    } else {
      carrito.push({ ...producto, cantidad: 1 });
    }

    guardarCarrito();
    mostrarCarrito();
    mostrarToast("Agregado al carrito", "success");
  };

  window.agregarCantidad = function(id) {
    const item = carrito.find(producto => producto.id === id);

    if (item) {
      item.cantidad += 1;
      guardarCarrito();
      mostrarCarrito();
    }
  };

  window.disminuirCantidad = function(id) {
    const item = carrito.find(producto => producto.id === id);
    if (!item) return;

    item.cantidad -= 1;

    if (item.cantidad <= 0) {
      carrito = carrito.filter(producto => producto.id !== id);
      mostrarToast("Eliminado de Carrito", "error");
    }

    guardarCarrito();
    mostrarCarrito();
  };

  window.eliminarProducto = function(id) {
    const item = carrito.find(producto => producto.id === id);
    if (!item) return;

    Swal.fire({
      ...sweetAlertConfig,
      title: "¿Estás seguro?",
      text: "Se eliminará este producto del carrito.",
      iconHtml: '<i class="fa-solid fa-trash"></i>',
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then(result => {
      if (result.isConfirmed) {
        carrito = carrito.filter(producto => producto.id !== id);
        guardarCarrito();
        mostrarCarrito();
        mostrarToast("Eliminado de Carrito", "error");
      }
    });
  };

  if (btnVaciarCarrito) {
    btnVaciarCarrito.addEventListener("click", () => {
      if (carrito.length === 0) {
        mostrarToast("El carrito ya está vacío", "error");
        return;
      }

      Swal.fire({
        ...sweetAlertConfig,
        title: "¿Vaciar carrito?",
        text: "Se eliminarán todos los productos de tu rutina.",
        iconHtml: '<i class="fa-solid fa-bag-shopping"></i>',
        showCancelButton: true,
        confirmButtonText: "Sí, vaciar",
        cancelButtonText: "Cancelar"
      }).then(result => {
        if (result.isConfirmed) {
          carrito = [];
          guardarCarrito();
          mostrarCarrito();
          mostrarToast("Carrito vaciado", "error");
        }
      });
    });
  }

  // Actualizo el contenido visual del carrito y sus estados.
  function mostrarCarrito() {
    const contenedorCarrito = document.getElementById("carrito-items");
    const contadorCarrito = document.getElementById("contador-carrito");

    contenedorCarrito.innerHTML = "";

    if (carrito.length === 0) {
      contenedorCarrito.innerHTML = `
        <p class="carrito-empty" role="status">Agrega productos para empezar a construir tu rutina.</p>
      `;
    } else {
      carrito.forEach(item => {
        const div = document.createElement("article");
        div.classList.add("carrito-item");
        div.innerHTML = `
          <span>${item.nombre} (x${item.cantidad}) - $${item.precio * item.cantidad}</span>
          <div class="carrito-actions">
            <button type="button" onclick="agregarCantidad(${item.id})" aria-label="Agregar cantidad">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
            </button>
            <button type="button" onclick="disminuirCantidad(${item.id})" aria-label="Disminuir cantidad">
              <i class="fa-solid fa-minus" aria-hidden="true"></i>
            </button>
            <button type="button" onclick="eliminarProducto(${item.id})">
              <i class="fa-solid fa-trash" aria-hidden="true"></i>
              Quitar de Carrito
            </button>
          </div>
        `;
        contenedorCarrito.appendChild(div);
      });
    }

    const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    contadorCarrito.textContent = cantidadTotal;

    actualizarEstadoCarrito();
    calcularTotal();
  }

  // Sin productos, deshabilito y muteo los botones de vaciar y finalizar.
  function actualizarEstadoCarrito() {
    const carritoVacio = carrito.length === 0;

    if (carritoDrawer) {
      carritoDrawer.classList.toggle("is-empty", carritoVacio);
      carritoDrawer.classList.toggle("has-items", !carritoVacio);
    }

    [btnVaciarCarrito, btnFinalizar].forEach(boton => {
      if (!boton) return;

      boton.disabled = carritoVacio;
      boton.setAttribute("aria-disabled", String(carritoVacio));
      boton.classList.toggle("is-muted", carritoVacio);
      boton.classList.toggle("is-active", !carritoVacio);
    });
  }

  function calcularTotal() {
    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    document.getElementById("total").textContent = total;
  }

  // Validación simple del correo usando métodos de string
  function validarCorreo(correo) {
    return correo.includes("@") && correo.includes(".");
  }

  // Valida la fecha con formato simple MM/AA sin usar expresiones regulares.
  function validarVencimiento(vencimiento) {
    if (!vencimiento.includes("/") || vencimiento.length !== 5) {
      return false;
    }

    const partes = vencimiento.split("/");
    const mes = Number(partes[0]);
    const anio = partes[1];

    return mes >= 1 && mes <= 12 && anio.length === 2 && !isNaN(anio);
  }

  // Simula checkout con validación de datos.
  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", () => {
      if (carrito.length === 0) {
        mostrarToast("Carrito vacío. Agrega al menos un producto antes de finalizar.", "error");
        return;
      }

      const checkoutHTML = `
        <form id="checkout-form" novalidate>
          <label>Nombre<input type="text" id="nombre"></label>
          <label>Correo<input type="text" id="correo"></label>
          <label>Teléfono<input type="text" id="telefono" maxlength="10"></label>
          <label>Ciudad<input type="text" id="ciudad"></label>
          <label>Dirección<input type="text" id="direccion"></label>
          <label>Número de tarjeta<input type="text" id="tarjeta" maxlength="16"></label>
          <div class="checkout-row">
            <label>Fecha de vencimiento<input type="text" id="vencimiento" maxlength="5" placeholder="MM/AA"></label>
            <label>CVV<input type="text" id="cvv" maxlength="3"></label>
          </div>
          <button type="submit">
            <i class="fa-solid fa-lock" aria-hidden="true"></i>
            Confirmar compra
          </button>
        </form>
      `;

      Swal.fire({
        ...sweetAlertConfig,
        title: "Checkout",
        html: checkoutHTML,
        showConfirmButton: false,
        showCloseButton: true
      });

      document.getElementById("checkout-form").addEventListener("submit", e => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const ciudad = document.getElementById("ciudad").value.trim();
        const direccion = document.getElementById("direccion").value.trim();
        const tarjeta = document.getElementById("tarjeta").value.trim();
        const vencimiento = document.getElementById("vencimiento").value.trim();
        const cvv = document.getElementById("cvv").value.trim();

        let hayError = false;

        if (!nombre || !correo || !telefono || !ciudad || !direccion || !tarjeta || !vencimiento || !cvv) hayError = true;
        if (correo && !validarCorreo(correo)) hayError = true;
        if (vencimiento && !validarVencimiento(vencimiento)) hayError = true;

        if (telefono && (isNaN(telefono) || telefono.length < 7)) hayError = true;
        if (tarjeta && (isNaN(tarjeta) || tarjeta.length !== 16)) hayError = true;
        if (cvv && (isNaN(cvv) || cvv.length !== 3)) hayError = true;

        if (hayError) {
          mostrarToast("Algunos campos están incorrectos o incompletos, revisa tus datos", "error");
          return;
        }

        Swal.fire({
          ...sweetAlertConfig,
          iconHtml: '<i class="fa-solid fa-check"></i>',
          title: "¡Rutina confirmada!",
          html: `
            <p>Gracias ${nombre} por tu compra.</p>
            <p>Total: $${carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}</p>
          `,
          confirmButtonText: "Cerrar"
        });

        carrito = [];
        guardarCarrito();
        mostrarCarrito();
      });
    });
  }
});