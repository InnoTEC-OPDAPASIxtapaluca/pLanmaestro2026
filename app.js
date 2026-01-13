function parseWKT(wkt) {
  if (!wkt) return null;

  // POINT
  if (wkt.startsWith("POINT")) {
    const coords = wkt
      .replace("POINT (", "")
      .replace(")", "")
      .split(" ")
      .map(Number);

    return {
      type: "POINT",
      coords: [coords[1], coords[0]] // 👈 INVERSIÓN CLAVE
    };
  }

  // LINESTRING
  if (wkt.startsWith("LINESTRING")) {
    const coords = wkt
      .replace("LINESTRING (", "")
      .replace(")", "")
      .split(",")
      .map(p => {
        const [lng, lat] = p.trim().split(" ").map(Number);
        return [lat, lng]; // 👈 INVERSIÓN CLAVE
      });

    return {
      type: "LINESTRING",
      coords
    };
  }

  return null;
}
