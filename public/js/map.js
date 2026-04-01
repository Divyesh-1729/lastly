function initMap() {
  const fallbackCenter = { lat: 18.5204, lng: 73.8567 };
   const mapEl = document.getElementById("map");
  const lat = mapEl ? Number(mapEl.dataset.lat) : NaN;
  const lng = mapEl ? Number(mapEl.dataset.lng) : NaN;
  const title = mapEl ? mapEl.dataset.title : "";
  const locationText = mapEl ? mapEl.dataset.locationText : "";

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const center = hasCoords ? { lat, lng } : fallbackCenter;

  const map = new google.maps.Map(mapEl, {
    center: center,
    zoom: 12,
    mapTypeId: "roadmap"

  });

  if (hasCoords) {
    const marker = new google.maps.Marker({
      position: center,
      map,
     title: title || "Listing",
    });

    const info = new google.maps.InfoWindow({
      content: `<div><strong>${(title || "Listing")}</strong><br/>${(locationText || "")}</div>`,
    });
    marker.addListener("click", () => info.open({ anchor: marker, map }));
  }
}