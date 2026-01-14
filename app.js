// ============================
// CONFIGURACIÓN MAPA
// ============================
const map = L.map("map", { zoomControl: false }).setView([19.32, -98.93], 13);
L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// ============================
// PANES (ORDEN DE CAPAS)
// ============================
map.createPane("municipioPane");
map.getPane("municipioPane").style.zIndex = 400;

map.createPane("datosPane");     // polígonos y líneas CSV
map.getPane("datosPane").style.zIndex = 500;

map.createPane("puntosPane");    // puntos siempre arriba
map.getPane("puntosPane").style.zIndex = 600;

// ============================
// POLÍGONO DEL MUNICIPIO
// ============================
fetch("./datos/poligono_ixtapaluca.json")
  .then(res => res.json())
  .then(geojson => {
    L.geoJSON(geojson, {
      pane: "municipioPane",
      style: {
        color: "#9D2449",
        weight: 3,
        fillColor: "#9D2449",
        fillOpacity: 0.1
      }
    }).addTo(map);
  });

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
const capas = {};                 // Apartado -> Bloque -> LayerGroup
const capasGlobales = [];
const controlesApartados = {};

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
function parseWKT(wkt) {
  if (!wkt) return null;

  if (wkt.startsWith("POINT")) {
    const [lng, lat] = wkt.replace("POINT (", "").replace(")", "").split(" ").map(Number);
    return { type: "POINT", coords: [lat, lng] };
  }

  if (wkt.startsWith("LINESTRING")) {
    const coords = wkt
      .replace("LINESTRING (", "")
      .replace(")", "")
      .split(",")
      .map(p => {
        const [lng, lat] = p.trim().split(" ").map(Number);
        return [lat, lng];
      });
    return { type: "LINESTRING", coords };
  }

  if (wkt.startsWith("POLYGON")) {
    const coords = wkt
      .replace("POLYGON ((", "")
      .replace("))", "")
      .split(",")
      .map(p => {
        const [lng, lat] = p.trim().split(" ").map(Number);
        return [lat, lng];
      });
    return { type: "POLYGON", coords };
  }

  return null;
}

// ============================
// CARGA CSV
// ============================
Papa.parse("datos.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function (results) {

    results.data.forEach(row => {
      const wkt = row.WKT?.trim();
      const apartado = row.Apartado?.trim() || "Otros";
      const bloque = row.Bloque?.trim() || "Sin bloque";

      if (!wkt) return;
      const geom = parseWKT(wkt);
      if (!geom) return;

      if (!capas[apartado]) capas[apartado] = {};
      if (!capas[apartado][bloque]) capas[apartado][bloque] = L.layerGroup().addTo(map);

      let layer;

      // ---------- PUNTOS ----------
      if (geom.type === "POINT") {
        layer = L.marker(geom.coords, {
          icon: iconoPunto,
          pane: "puntosPane"
        }).bindPopup(`<b>${row.Nombre || ""}</b><br>${row.Descripción || ""}`);
      }

      // ---------- LÍNEAS ----------
      if (geom.type === "LINESTRING") {
        layer = L.polyline(geom.coords, {
          pane: "datosPane",
          color: "#1f21b4",
          weight: 4
        }).bindPopup(`<b>${row.Nombre || ""}</b>`);
      }

      // ---------- POLÍGONOS ----------
      if (geom.type === "POLYGON") {
        layer = L.polygon(geom.coords, {
          pane: "datosPane",
          color: "#ff9900",
          fillColor: "#ffcc66",
          fillOpacity: 0.5,
          weight: 2
        }).bindPopup(`<b>${row.Nombre || ""}</b><br>${row.Descripción || ""}`);
      }

      if (layer) {
        layer.addTo(capas[apartado][bloque]);
        capasGlobales.push(layer);
      }
    });

    construirLista();
    zoomAutomatico();
  }
});

// ============================
// CONSTRUIR LISTA
// ============================
function construirLista() {
  lista.innerHTML = "";

  const btnGeneral = document.createElement("button");
  btnGeneral.textContent = "Apagar todo el mapa";
  btnGeneral.style.margin = "10px";
  lista.appendChild(btnGeneral);

  btnGeneral.addEventListener("click", () => {
    const apagar = btnGeneral.textContent === "Apagar todo el mapa";

    Object.keys(capas).forEach(apartado => {
      Object.keys(capas[apartado]).forEach(bloque => {
        const grupo = capas[apartado][bloque];
        apagar ? map.removeLayer(grupo) : grupo.addTo(map);
      });

      const btnApartado = controlesApartados[apartado];
      if (btnApartado) btnApartado.textContent = apagar ? "Encender todo" : "Apagar todo";
    });

    btnGeneral.textContent = apagar ? "Encender todo el mapa" : "Apagar todo el mapa";
  });

  Object.keys(capas).forEach(apartado => {
    const divApartado = document.createElement("div");
    divApartado.className = "bloque";

    const h = document.createElement("h4");
    h.textContent = apartado;
    divApartado.appendChild(h);

    Object.keys(capas[apartado]).forEach(bloque => {
      const div = document.createElement("div");
      div.className = "item";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = true;
      chk.onchange = () => {
        chk.checked
          ? capas[apartado][bloque].addTo(map)
          : map.removeLayer(capas[apartado][bloque]);
      };

      const label = document.createElement("span");
      label.textContent = bloque;
      label.onclick = () => {
        const fg = L.featureGroup();
        capas[apartado][bloque].eachLayer(l => fg.addLayer(l));
        if (fg.getBounds().isValid()) {
          map.fitBounds(fg.getBounds(), { padding: [40, 40], maxZoom: 17 });
        }
      };

      div.appendChild(chk);
      div.appendChild(label);
      divApartado.appendChild(div);
    });

    lista.appendChild(divApartado);
  });
}

// ============================
// ZOOM AUTOMÁTICO
// ============================
function zoomAutomatico() {
  if (!capasGlobales.length) return;
  const fg = L.featureGroup(capasGlobales);
  map.fitBounds(fg.getBounds(), { padding: [30, 30] });
}
