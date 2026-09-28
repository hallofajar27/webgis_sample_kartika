'use client';

import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon broken in bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PIN_COLORS: Record<string, string> = {
  'daun bawang': '#10b981', // emerald
  'seledri': '#14b8a6',     // teal
  'bayam': '#22c55e',       // green
  'kubis': '#84cc16',       // lime
  'buncis': '#eab308',      // yellow
  'terong hijau': '#a855f7',// purple
  'cabai rawit': '#ef4444', // red
};

function getPinColor(jenis: string): string {
  return PIN_COLORS[jenis?.toLowerCase().trim()] ?? '#f97316';
}

function makePinIcon(color: string) {
  return L.divIcon({
    html: `<svg width="26" height="34" viewBox="0 0 24 32" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
    </svg>`,
    className: '',
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -32],
  });
}

const styleDesaFn = () => ({
  color: '#ffffff',
  weight: 1,
  dashArray: '6, 6',
  fillOpacity: 0,
});
const styleSawahFn = () => ({ color: '#2d6a4f', weight: 1, fillColor: '#74c69d', fillOpacity: 0.45 });
const styleIrigasiFn = () => ({ color: '#1565c0', weight: 1.5 });
const styleSungaiFn = () => ({ color: '#0284c7', weight: 2 });

type AnyProps = Record<string, unknown>;
type GeoJSONData = GeoJSON.FeatureCollection<GeoJSON.Geometry, AnyProps>;

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Fit map bounds directly to vegetable sample points once loaded
function FitBoundsToSamples({
  sayuran,
}: {
  sayuran: GeoJSONData | null;
  sungaiSampel?: GeoJSONData | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!sayuran || sayuran.features.length === 0) return;

    const coords: [number, number][] = [];
    sayuran.features.forEach((f) => {
      if (f.geometry.type === 'Point') {
        const [lon, lat] = f.geometry.coordinates;
        coords.push([lat, lon]);
      }
    });

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, sayuran]);

  return null;
}

function Legend() {
  const map = useMap();
  useEffect(() => {
    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const pinSvg = (color: string) => `
        <svg width="14" height="18" viewBox="0 0 24 32" style="vertical-align:middle;flex-shrink:0">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
        </svg>`;

      const div = L.DomUtil.create('div');
      div.innerHTML = `
        <div style="background:#ffffff;color:#1e293b;padding:12px 16px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:13px;line-height:2;min-width:210px">
          <div style="font-weight:700;margin-bottom:4px;font-size:14px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;color:#0f172a">Legenda</div>
          <div style="display:flex;align-items:center;gap:8px;color:#1e293b"><span style="display:inline-block;width:22px;height:0px;border-top:2.5px dashed #475569;flex-shrink:0"></span>Batas Desa (Dash Putih)</div>
          <div style="display:flex;align-items:center;gap:8px;color:#1e293b"><span style="display:inline-block;width:22px;height:13px;background:#74c69d;border:1.5px solid #2d6a4f;border-radius:2px;flex-shrink:0"></span>Sawah</div>
          <div style="display:flex;align-items:center;gap:8px;color:#1e293b"><span style="display:inline-block;width:22px;height:3px;background:#1565c0;flex-shrink:0"></span>Jaringan Irigasi</div>
          <div style="display:flex;align-items:center;gap:8px;color:#1e293b"><span style="display:inline-block;width:22px;height:3px;background:#0284c7;flex-shrink:0"></span>Sungai</div>
          <div style="border-top:1px solid #e2e8f0;margin:4px 0"></div>
          <div style="font-weight:600;font-size:12px;color:#475569;margin-bottom:2px">Sampel Sayuran</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 8px;font-size:12px;color:#1e293b">
            <span style="display:flex;align-items:center;gap:4px">${pinSvg('#10b981')} Daun Bawang</span>
            <span style="display:flex;align-items:center;gap:4px">${pinSvg('#14b8a6')} Seledri</span>
            <span style="display:flex;align-items:center;gap:4px">${pinSvg('#22c55e')} Bayam</span>
            <span style="display:flex;align-items:center;gap:4px">${pinSvg('#84cc16')} Kubis</span>
            <span style="display:flex;align-items:center;gap:4px">${pinSvg('#eab308')} Buncis</span>
            <span style="display:flex;align-items:center;gap:4px">${pinSvg('#a855f7')} Terong</span>
            <span style="display:flex;align-items:center;gap:4px">${pinSvg('#ef4444')} Cabai Rawit</span>
          </div>
          <div style="margin-top:6px;display:flex;align-items:center;gap:6px;color:#1e293b">${pinSvg('#0284c7')} Sampel Sungai</div>
        </div>`;
      return div;
    };
    legend.addTo(map);
    return () => { legend.remove(); };
  }, [map]);
  return null;
}

export default function MapClient() {
  const [layers, setLayers] = useState<{
    desa: GeoJSONData | null;
    sawah: GeoJSONData | null;
    irigasi: GeoJSONData | null;
    sungai: GeoJSONData | null;
    sayuran: GeoJSONData | null;
    sungaiSampel: GeoJSONData | null;
  }>({ desa: null, sawah: null, irigasi: null, sungai: null, sayuran: null, sungaiSampel: null });

  useEffect(() => {
    const files: [keyof typeof layers, string][] = [
      ['desa', '/geojson/geojson_Batas_Desa_Kec_Sumowono.geojson'],
      ['sawah', '/geojson/geojson_sawah.geojson'],
      ['irigasi', '/geojson/geojson_jaringan_irigasi.geojson'],
      ['sungai', '/geojson/geojson_sungai.geojson'],
      ['sayuran', '/geojson/geojson_koordinat_sampel_sayuran.geojson'],
      ['sungaiSampel', '/geojson/geojson_koordinat_sampel_sungai.geojson'],
    ];
    files.forEach(([key, url]) => {
      fetch(url).then(r => r.json()).then(data => setLayers(prev => ({ ...prev, [key]: data })));
    });
  }, []);

  const onEachDesa = (feature: GeoJSON.Feature<GeoJSON.Geometry, AnyProps>, layer: L.Layer) => {
    const p = feature.properties ?? {};
    const name = p.WADMKD || p.NAMOBJ;
    if (name) {
      layer.bindTooltip(String(name), {
        permanent: true,
        direction: 'center',
        className: 'desa-label',
      });
    }
  };

  const onEachSawah = (feature: GeoJSON.Feature<GeoJSON.Geometry, AnyProps>, layer: L.Layer) => {
    const p = feature.properties ?? {};
    layer.bindPopup(`<div style="min-width:160px;color:#1e293b">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#0f172a">🌾 ${p.Nama_DI ?? '-'}</div>
      <table style="border-collapse:collapse;font-size:13px;width:100%;color:#1e293b">
        <tr><td style="color:#64748b;padding-right:8px">Status</td><td>${p.Status ?? '-'}</td></tr>
        <tr><td style="color:#64748b;padding-right:8px">Kewenangan</td><td>${p.Kewenangan ?? '-'}</td></tr>
        <tr><td style="color:#64748b;padding-right:8px">Luas</td><td>${p.Luas_CEA ? p.Luas_CEA + ' ha' : '-'}</td></tr>
      </table></div>`);
  };

  const onEachSungai = (feature: GeoJSON.Feature<GeoJSON.Geometry, AnyProps>, layer: L.Layer) => {
    const p = feature.properties ?? {};
    layer.bindPopup(`<div style="font-size:13px;color:#1e293b">
      <div style="font-weight:700;font-size:14px;margin-bottom:2px;color:#0f172a">🌊 ${p.NAMOBJ ?? 'Tidak diketahui'}</div>
      <div style="color:#64748b">${p.REMARK ?? ''}</div></div>`);
  };

  const pointToLayerSayuran = (feature: GeoJSON.Feature<GeoJSON.Geometry, AnyProps>, latlng: L.LatLng) =>
    L.marker(latlng, { icon: makePinIcon(getPinColor(String(feature.properties?.SAMPEL ?? ''))) });

  const onEachSayuran = (feature: GeoJSON.Feature<GeoJSON.Geometry, AnyProps>, layer: L.Layer) => {
    const p = feature.properties ?? {};
    const color = getPinColor(String(p.SAMPEL ?? ''));
    layer.bindPopup(`<div style="min-width:200px;color:#1e293b">
      <div style="font-weight:700;font-size:15px;margin-bottom:6px;color:#0f172a;display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};border:1.5px solid #fff;box-shadow:0 0 2px rgba(0,0,0,0.4)"></span>
        ${p.SAMPEL ?? '-'}
      </div>
      <table style="border-collapse:collapse;font-size:13px;width:100%;color:#1e293b">
        <tr><td style="color:#64748b;padding-right:10px;padding-bottom:3px">Lokasi</td><td>${p['Desa/Lokas'] ?? '-'}</td></tr>
        <tr><td style="color:#64748b;padding-right:10px;padding-bottom:3px">Responden</td><td>${p['Nama respo'] ?? '-'}</td></tr>
        <tr style="background:#fff3f3"><td style="color:#c62828;font-weight:600;padding-right:10px;padding-bottom:3px">Pb</td><td style="font-weight:600;color:#c62828">${p.Pb !== undefined ? p.Pb + ' mg/kg' : '-'}</td></tr>
        <tr style="background:#fff3f3"><td style="color:#c62828;font-weight:600;padding-right:10px">Cd</td><td style="font-weight:600;color:#c62828">${p.Cd !== undefined ? p.Cd + ' mg/kg' : '-'}</td></tr>
      </table>
      <div style="margin-top:5px;font-size:11px;color:#64748b">Pb = Timbal &nbsp;|&nbsp; Cd = Kadmium</div></div>`);
  };

  const pointToLayerSungaiSampel = (_: GeoJSON.Feature<GeoJSON.Geometry, AnyProps>, latlng: L.LatLng) =>
    L.marker(latlng, { icon: makePinIcon('#0284c7') });

  const onEachSungaiSampel = (feature: GeoJSON.Feature<GeoJSON.Geometry, AnyProps>, layer: L.Layer) => {
    const p = feature.properties ?? {};
    layer.bindPopup(`<div style="min-width:170px;color:#1e293b">
      <div style="font-weight:700;font-size:15px;margin-bottom:6px;color:#0f172a;display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#0284c7;border:1.5px solid #fff;box-shadow:0 0 2px rgba(0,0,0,0.4)"></span>
        Titik Sampel Sungai
      </div>
      <table style="border-collapse:collapse;font-size:13px;width:100%;color:#1e293b">
        <tr><td style="color:#64748b;padding-right:10px;padding-bottom:3px">Kode</td><td>${p.Kode ?? '-'}</td></tr>
        <tr><td style="color:#64748b;padding-right:10px;padding-bottom:3px">Lokasi</td><td>${p.Lokasi ?? '-'}</td></tr>
        <tr style="background:#e8f4fd"><td style="color:#0277bd;font-weight:600;padding-right:10px">Pb</td><td style="font-weight:600;color:#0277bd">${p.Pb !== undefined ? p.Pb + ' mg/kg' : '-'}</td></tr>
      </table>
      <div style="margin-top:5px;font-size:11px;color:#64748b">Pb = Timbal (Logam Berat)</div></div>`);
  };

  const CENTER: [number, number] = [-7.216, 110.307];

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapContainer center={CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
        <InvalidateSize />
        <FitBoundsToSamples sayuran={layers.sayuran} sungaiSampel={layers.sungaiSampel} />
        <LayersControl position="topright" >
          <LayersControl.BaseLayer checked name="Google Satellite">
            <TileLayer
              attribution="&copy; Google"
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Streets">
            <TileLayer
              attribution="&copy; Google"
              url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Hybrid">
            <TileLayer
              attribution="&copy; Google"
              url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Terrain">
            <TileLayer
              attribution="&copy; Google"
              url="https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Batas Desa">
            {layers.desa && <GeoJSON key="desa" data={layers.desa} style={styleDesaFn} onEachFeature={onEachDesa} />}
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Sawah">
            {layers.sawah && <GeoJSON key="sawah" data={layers.sawah} style={styleSawahFn} onEachFeature={onEachSawah} />}
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Jaringan Irigasi">
            {layers.irigasi && <GeoJSON key="irigasi" data={layers.irigasi} style={styleIrigasiFn} />}
          </LayersControl.Overlay>
          <LayersControl.Overlay  name="Sungai">
            {layers.sungai && <GeoJSON key="sungai" data={layers.sungai} style={styleSungaiFn} onEachFeature={onEachSungai} />}
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Sampel Sayuran">
            {layers.sayuran && (
              <GeoJSON key="sayuran" data={layers.sayuran} pointToLayer={pointToLayerSayuran} onEachFeature={onEachSayuran} />
            )}
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Sampel Sungai">
            {layers.sungaiSampel && (
              <GeoJSON key="sungaiSampel" data={layers.sungaiSampel} pointToLayer={pointToLayerSungaiSampel} onEachFeature={onEachSungaiSampel} />
            )}
          </LayersControl.Overlay>
        </LayersControl>
        <Legend />
      </MapContainer>
    </div>
  );
}
