// ============================
// CONFIGURACIÓN MAPA
// ============================
const map = L.map("map", { zoomControl: false }).setView([19.32, -98.93], 13);
L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// ============================
// ICONO PUNTOS
// ============================
const iconoPunto = L.icon({
  iconUrl: "./imagenes/iconopozos.png",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28]
});

// ============================
// CONTENEDORES GLOBALES
// ============================
const lista = document.getElementById("lista");
const capas = {};              // Apartado -> Bloque -> LayerGroup
const capasGlobales = [];      // Todos los layers individuales
const controlesApartados = {}; // Botones de cada apartado

// ============================
// TOGGLE PANEL
// ============================
window.togglePanel = function () {
  const panel = document.getElementById("panel");
  const btn = document.querySelector(".btn-panel");
  const oculto = panel.classList.toggle("oculto");
  btn.style.left = oculto ? "0px" : "320px";
};

// ============================
// PARSER WKT
// ============================
function parseW
