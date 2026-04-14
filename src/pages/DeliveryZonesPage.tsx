import { useEffect, useState, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  X,
  PlusCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import {
  fetchDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  toggleZoneStatus
} from "@/services/deliveryZones.service";
import type { DeliveryZone, CreateDeliveryZoneInput } from "@/types/deliveryZone.types";
import { ZoneLocationPicker } from "@/components/delivery/ZoneLocationPicker";

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateDeliveryZoneInput>({
    zoneName: "",
    district: "",
    referenceKeywords: [],
    deliveryFee: 0,
    etaMin: 30,
    etaMax: 45,
    isActive: true,
    isDefault: false,
    centerLat: null,
    centerLng: null,
    radiusMeters: null,
    priority: 0,
    matchMode: 'hybrid',
  });
  const [newKeyword, setNewKeyword] = useState("");

  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDeliveryZones();
      setZones(data);
    } catch (error) {
      console.error("Error loading zones:", error);
      toast.error("No se pudieron cargar las zonas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const filteredZones = zones.filter(zone => 
    zone.zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        zoneName: zone.zoneName,
        district: zone.district,
        referenceKeywords: [...zone.referenceKeywords],
        deliveryFee: zone.deliveryFee,
        etaMin: zone.etaMin,
        etaMax: zone.etaMax,
        isActive: zone.isActive,
        isDefault: zone.isDefault,
        centerLat: zone.centerLat,
        centerLng: zone.centerLng,
        radiusMeters: zone.radiusMeters,
        priority: zone.priority,
        matchMode: zone.matchMode,
      });
    } else {
      setEditingZone(null);
      setFormData({
        zoneName: "",
        district: "",
        referenceKeywords: [],
        deliveryFee: 0,
        etaMin: 30,
        etaMax: 45,
        isActive: true,
        isDefault: false,
        centerLat: null,
        centerLng: null,
        radiusMeters: null,
        priority: 0,
        matchMode: 'hybrid',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingZone(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingZone) {
        await updateDeliveryZone(editingZone.id, formData);
        toast.success("Zona actualizada correctamente");
      } else {
        await createDeliveryZone(formData);
        toast.success("Zona creada correctamente");
      }
      setIsModalOpen(false);
      loadZones();
    } catch (error) {
      console.error("Error saving zone:", error);
      toast.error("Error al guardar la zona");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta zona?")) return;

    try {
      await deleteDeliveryZone(id);
      toast.success("Zona eliminada");
      loadZones();
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error("No se pudo eliminar la zona");
    }
  };

  const handleToggleStatus = async (zone: DeliveryZone) => {
    try {
      await toggleZoneStatus(zone.id, !zone.isActive);
      setZones(prev => prev.map(z => 
        z.id === zone.id ? { ...z, isActive: !z.isActive } : z
      ));
      toast.success(`Zona ${!zone.isActive ? 'activada' : 'desactivada'}`);
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    if (formData.referenceKeywords.includes(newKeyword.trim())) {
      setNewKeyword("");
      return;
    }
    setFormData(prev => ({
      ...prev,
      referenceKeywords: [...prev.referenceKeywords, newKeyword.trim()]
    }));
    setNewKeyword("");
  };

  const removeKeyword = (kw: string) => {
    setFormData(prev => ({
      ...prev,
      referenceKeywords: prev.referenceKeywords.filter(k => k !== kw)
    }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      centerLat: lat,
      centerLng: lng,
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Zonas de Delivery</h1>
          <p className="text-sm text-slate-500">Configura las áreas de cobertura, costos y tiempos de entrega.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Zona
        </Button>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o distrito..."
              className="pl-9 rounded-xl border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[200px]">Zona</TableHead>
                <TableHead>Distrito</TableHead>
                <TableHead className="text-center">Costo</TableHead>
                <TableHead className="text-center">ETA</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    Cargando zonas...
                  </TableCell>
                </TableRow>
              ) : filteredZones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    No se encontraron zonas.
                  </TableCell>
                </TableRow>
              ) : (
                filteredZones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{zone.zoneName}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {zone.referenceKeywords.slice(0, 3).map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 bg-slate-50">
                            {kw}
                          </Badge>
                        ))}
                        {zone.referenceKeywords.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{zone.referenceKeywords.length - 3}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{zone.district}</TableCell>
                    <TableCell className="text-center font-semibold text-slate-900">
                      S/ {zone.deliveryFee.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center text-slate-600">
                      {zone.etaMin}-{zone.etaMax} min
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(zone)}
                        className={zone.isActive ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-slate-400"}
                      >
                        {zone.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(zone)}
                          className="h-8 w-8 rounded-lg text-slate-600 hover:text-slate-900"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(zone.id)}
                          className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg">
            <Card className="rounded-3xl border-slate-200 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6">
                <CardTitle className="text-xl">
                  {editingZone ? "Editar Zona" : "Nueva Zona de Delivery"}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 p-6 overflow-y-auto max-h-[70vh]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Nombre de la Zona</label>
                      <Input
                        required
                        placeholder="Ej: Zona Central"
                        className="rounded-xl"
                        value={formData.zoneName}
                        onChange={e => setFormData(prev => ({ ...prev, zoneName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Distrito</label>
                      <Input
                        required
                        placeholder="Ej: Iquitos"
                        className="rounded-xl"
                        value={formData.district}
                        onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Tarifa (S/)</label>
                      <Input
                        type="number"
                        step="0.1"
                        required
                        className="rounded-xl"
                        value={formData.deliveryFee}
                        onChange={e => setFormData(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">ETA Min</label>
                      <Input
                        type="number"
                        required
                        className="rounded-xl"
                        value={formData.etaMin || 0}
                        onChange={e => setFormData(prev => ({ ...prev, etaMin: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">ETA Max</label>
                      <Input
                        type="number"
                        required
                        className="rounded-xl"
                        value={formData.etaMax || 0}
                        onChange={e => setFormData(prev => ({ ...prev, etaMax: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Palabras Clave (Keywords)</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Referencia o lugar..."
                        className="rounded-xl"
                        value={newKeyword}
                        onChange={e => setNewKeyword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={addKeyword} className="rounded-xl shrink-0">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.referenceKeywords.map((kw, i) => (
                        <Badge key={i} className="rounded-lg py-1 pl-2 pr-1 flex items-center gap-1 bg-slate-100 text-slate-700 border-slate-200">
                          {kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(kw)}
                            className="p-0.5 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {formData.referenceKeywords.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No hay palabras clave configuradas.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-700">Configuración de Geolocalización</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-600">Latitud Centro</label>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="-12.0464"
                          className="rounded-xl"
                          value={formData.centerLat || ''}
                          onChange={e => setFormData(prev => ({ ...prev, centerLat: e.target.value ? Number(e.target.value) : null }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-slate-600">Longitud Centro</label>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="-77.0428"
                          className="rounded-xl"
                          value={formData.centerLng || ''}
                          onChange={e => setFormData(prev => ({ ...prev, centerLng: e.target.value ? Number(e.target.value) : null }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-600">Radio (metros)</label>
                      <Input
                        type="number"
                        step="10"
                        placeholder="1000"
                        className="rounded-xl"
                        value={formData.radiusMeters || ''}
                        onChange={e => setFormData(prev => ({ ...prev, radiusMeters: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <ZoneLocationPicker
                      lat={formData.centerLat}
                      lng={formData.centerLng}
                      radius={formData.radiusMeters}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      className="rounded border-slate-300"
                      checked={formData.isActive}
                      onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Zona Activa</label>
                  </div>
                </CardContent>
                <div className="flex justify-end gap-3 border-t border-slate-100 p-6 bg-slate-50 rounded-b-3xl">
                  <Button type="button" variant="ghost" onClick={handleCloseModal} className="rounded-2xl">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-2xl min-w-[120px]">
                    {submitting ? "Guardando..." : "Guardar Zona"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
