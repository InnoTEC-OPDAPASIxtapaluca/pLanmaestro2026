// =====================
// MAPA
// =====================
const map = L.map("map").setView([19.312, -98.885], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// =====================
// CAPAS
// =====================
const capas = {
  POZO: L.layerGroup().addTo(map),
  TANQUE: L.layerGroup().addTo(map),
  TRAMO: L.layerGroup().addTo(map)
};

// =====================
// ICONOS
// =====================
const iconos = {
  POZO: L.icon({
    iconUrl: "./imagenes/iconopozos.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  }),
  TANQUE: L.icon({
    iconUrl: "./imagenes/iconotanque.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  })
};

// =====================
// WKT PARSER
// =====================
function parseWKT(wkt) {
  if (!wkt) return null;

  if (wkt.startsWith("POINT")) {
    const [lng, lat] = wkt.replace("POINT (","").replace(")","").split(" ").map(Number);
    return { geom: "POINT", coords: [lat, lng] };
  }

  if (wkt.startsWith("LINESTRING")) {
    const coords = wkt.replace("LINESTRING (","").replace(")","")
      .split(",")
      .map(p => {
        const [lng, lat] = p.trim().split(" ").map(Number);
        return [lat, lng];
      });
    return { geom: "LINESTRING", coords };
  }
}

// =====================
// DATOS
// =====================
const elementos = [];
const lista = document.getElementById("lista");
const infoBox = document.getElementById("info-box");

// =====================
// CSV
// =====================
Papa.parse("datos.csv", {
  download: true,
  header: true,
  complete: function (results) {

    results.data.forEach(row => {
      const geo = parseWKT(row.WKT);
      if (!geo) return;

      let layer;

      if (geo.geom === "POINT") {
        layer = L.marker(geo.coords, {
          icon: iconos[row.Tipo] || iconos.POZO
        }).addTo(capas[row.Tipo] || capas.POZO);
      }

      if (geo.geom === "LINESTRING") {
        layer = L.polyline(geo.coords, {
          weight: 4
        }).addTo(capas.TRAMO);
      }

      elementos.push({
        tipo: row.Tipo,
        geom: geo.geom,
        nombre: row.Lista || row.Nombre,
        data: row,
        layer,
        coords: geo.coords,
        bounds: layer.getBounds?.()
      });
    });

    renderLista();
  }
});

// =====================
// LISTA + FICHA
// =====================
function renderLista() {
  lista.innerHTML = "";

  elementos.forEach(el => {
    if (!map.hasLayer(capas[el.tipo])) return;

    const li = document.createElement("li");
    li.textContent = el.nombre;

    li.onclick = () => {
      infoBox.innerHTML = `
        <h3>${el.data.Nombre}</h3>
        ${el.data.Gasto ? `<div><b>Gasto:</b> ${el.data.Gasto}</div>` : ""}
        ${el.data.Estatus ? `<div><b>Estatus:</b> ${el.data.Estatus}</div>` : ""}
        ${el.data.Estado ? `<div><b>Estado:</b> ${el.data.Estado}</div>` : ""}
        ${el.data.Domicilio ? `<div><b>Domicilio:</b> ${el.data.Domicilio}</div>` : ""}
        ${el.data.Descripcion ? `<div>${el.data.Descripcion}</div>` : ""}
      `;
      infoBox.classList.remove("hidden");

      el.geom === "POINT"
        ? map.flyTo(el.coords, 16)
        : map.fitBounds(el.bounds);
    };

    lista.appendChild(li);
  });
}

// =====================
// TOGGLE CAPAS
// =====================
function toggleCapa(tipo) {
  map.hasLayer(capas[tipo])
    ? map.removeLayer(capas[tipo])
    : map.addLayer(capas[tipo]);

  renderLista();
}

// =====================
// BOTÓN CENTRAR
// =====================
document.getElementById("btn-centro").onclick = () => {
  const visibles = elementos
    .filter(e => map.hasLayer(capas[e.tipo]))
    .map(e => e.layer);

  if (visibles.length) {
    map.fitBounds(L.featureGroup(visibles).getBounds());
  }
};
L.marker([19.32, -98.88]).addTo(map).bindPopup("PRUEBA");
