import { useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Circle, 
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface ZoneLocationPickerProps {
  lat: number | null;
  lng: number | null;
  radius: number | null;
  onChange: (lat: number, lng: number) => void;
  defaultCenter?: [number, number];
}

function LocationMarker({ lat, lng, onChange }: { lat: number | null, lng: number | null, onChange: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return lat !== null && lng !== null ? (
    <Marker position={[lat, lng]} />
  ) : null;
}

function PanToCenter({ lat, lng }: { lat: number | null, lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export function ZoneLocationPicker({ 
  lat, 
  lng, 
  radius, 
  onChange, 
  defaultCenter = [-12.0464, -77.0428] // Default to Lima, Peru
}: ZoneLocationPickerProps) {
  const initialCenter: [number, number] = (lat && lng) ? [lat, lng] : defaultCenter;

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 relative">
      <MapContainer 
        center={initialCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} />
        <PanToCenter lat={lat} lng={lng} />
        {lat !== null && lng !== null && radius && (
          <Circle
            center={[lat, lng]}
            pathOptions={{ 
              fillColor: '#3b82f6', 
              color: '#3b82f6', 
              weight: 1, 
              fillOpacity: 0.2 
            }}
            radius={radius}
          />
        )}
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-medium text-slate-500 border border-slate-200 shadow-sm">
        Haz clic en el mapa para ubicar el centro
      </div>
    </div>
  );
}
