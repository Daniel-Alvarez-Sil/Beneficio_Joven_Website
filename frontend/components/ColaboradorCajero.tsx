"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Camera, CameraOff, ImagePlus, Loader2, QrCode, ScanLine, CheckCircle2, XCircle } from "lucide-react";

type ScanStatus = "valido" | "invalido" | "usado" | "desconocido";

interface ScanResult {
  id: string;                 // el texto leído (código/qr)
  status: ScanStatus;         // mock por ahora
  promo?: string;             // mock: nombre de promo
  timestamp: string;          // ISO string
  monto?: number;             // mock
}

const supportsBarcode =
  typeof window !== "undefined" &&
  (window as any).BarcodeDetector &&
  Array.isArray((window as any).BarcodeDetector.getSupportedFormats);

export function ColaboradorCajero({
  colaboradorName,
  idNegocio = "3",
}: {
  colaboradorName: string;
  idNegocio?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);

  const [camEnabled, setCamEnabled] = useState<boolean>(false);
  const [usingBackCam, setUsingBackCam] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>("");

  const [results, setResults] = useState<ScanResult[]>([]);
  const [openQuickCreate, setOpenQuickCreate] = useState(false);

  // Mock: decidir estado de un código “escaneado”
  const evaluateCode = (code: string): ScanResult => {
    // Lógica de demo: patrón tonto solo para UI
    const lower = code.toLowerCase();
    let status: ScanStatus = "desconocido";
    if (lower.includes("ok") || lower.startsWith("bj-") || lower.match(/\d{4,}/)) status = "valido";
    if (lower.includes("used")) status = "usado";
    if (lower.includes("bad") || lower.includes("x")) status = "invalido";

    const promo = status === "valido" ? "Promo demo (2x1)" : undefined;
    const monto = status === "valido" ? 120 : undefined;

    return {
      id: code,
      status,
      promo,
      monto,
      timestamp: new Date().toISOString(),
    };
  };

  // Iniciar / detener cámara
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: usingBackCam ? { ideal: "environment" } : { ideal: "user" },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamEnabled(true);
      setIsScanning(true);
    } catch (e) {
      console.error(e);
      setCamEnabled(false);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    setCamEnabled(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  };

  // Loop de detección con BarcodeDetector (si existe)
  useEffect(() => {
    let raf = 0;
    let canceled = false;

    const tick = async () => {
      if (!isScanning || !videoRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      try {
        if (!detectorRef.current) {
          const formats = await (window as any).BarcodeDetector.getSupportedFormats?.();
          detectorRef.current = new (window as any).BarcodeDetector({ formats });
        }
        const bitmap = await createImageBitmap(videoRef.current);
        const codes = await detectorRef.current.detect(bitmap);
        bitmap.close();

        if (Array.isArray(codes) && codes.length > 0) {
          const text = String(codes[0]?.rawValue ?? "").trim();
          if (text) {
            setIsScanning(false); // pausa rápida para no duplicar
            const r = evaluateCode(text);
            setResults((prev) => [r, ...prev].slice(0, 20));
            // reanudar después de un pequeño delay para permitir mostrar feedback
            setTimeout(() => setIsScanning(true), 600);
          }
        }
      } catch {
        // Ignora errores transitorios del detector
      }
      if (!canceled) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      canceled = true;
      cancelAnimationFrame(raf);
    };
  }, [isScanning]);

  // Cambiar cámara (frontal/trasera)
  const toggleFacing = async () => {
    const next = !usingBackCam;
    setUsingBackCam(next);
    if (camEnabled) {
      stopCamera();
      await startCamera();
    }
  };

  // Fallback: subir imagen con código (simplemente leemos el nombre como demo)
  const onUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // En un caso real usarías un detector sobre el bitmap de la imagen.
    const mockText = file.name.replace(/\.[^.]+$/, "");
    const r = evaluateCode(mockText);
    setResults((prev) => [r, ...prev].slice(0, 20));
  };

  const onManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    const r = evaluateCode(code);
    setResults((prev) => [r, ...prev].slice(0, 20));
    setManualCode("");
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta: escáner */}
      <Card className="glass border border-white/15">
        <CardHeader className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-white flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            Escanear promoción
          </CardTitle>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="camSwitch" className="text-white/70 text-sm">Cámara</Label>
              <Switch id="camSwitch" checked={camEnabled} onCheckedChange={(v) => (v ? startCamera() : stopCamera())}/>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFacing}
              disabled={!camEnabled}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              title="Cambiar cámara (frontal/trasera)"
            >
              {usingBackCam ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">Cambiar</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid lg:grid-cols-2 gap-6">
          {/* Vista de cámara o fallback */}
          <div className="space-y-3">
            <div className="aspect-video rounded-xl overflow-hidden border border-white/15 bg-black/50 grid place-items-center">
              {supportsBarcode ? (
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <div className="p-6 text-center text-white/70">
                  <QrCode className="w-8 h-8 mx-auto mb-3" />
                  Tu navegador no soporta BarcodeDetector. Usa el botón para subir una imagen con un código o ingresa el código manualmente.
                </div>
              )}
            </div>

            {!supportsBarcode && (
              <div className="flex items-center justify-between gap-3">
                <Label className="text-white/70 text-sm">Subir imagen</Label>
                <div>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 border border-white/20 cursor-pointer">
                    <ImagePlus className="w-4 h-4" />
                    <span>Seleccionar archivo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={onUploadImage}/>
                  </label>
                </div>
              </div>
            )}

            {/* Manual */}
            <form onSubmit={onManualSubmit} className="flex items-center gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Pega o escribe el código aquí…"
                className="bg-white/10 border-white/30 text-white placeholder-white/60"
              />
              <Button type="submit" className="btn-gradient btn-apple text-white">Validar</Button>
            </form>
          </div>

          {/* Resultados y acciones */}
          <div className="space-y-4">
            <Card className="glass border border-white/15">
              <CardHeader className="py-4">
                <CardTitle className="text-sm text-white/70">Últimos escaneos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[320px] overflow-auto pr-1">
                {results.length === 0 ? (
                  <div className="text-sm text-white/60">Aún no hay lecturas.</div>
                ) : results.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 bg-white/5">
                    <div className="min-w-0">
                      <div className="font-medium text-white/90 truncate">{r.id}</div>
                      <div className="text-xs text-white/60">
                        {new Date(r.timestamp).toLocaleString("es-MX")}
                      </div>
                      {r.promo && (
                        <div className="text-xs text-white/70 mt-1">Promo: {r.promo} {r.monto ? `• $${r.monto}` : ""}</div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {r.status === "valido" && (
                        <Badge className="bg-emerald-600/80 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Válido
                        </Badge>
                      )}
                      {r.status === "invalido" && (
                        <Badge className="bg-red-600/80 gap-1">
                          <XCircle className="w-3 h-3" /> Inválido
                        </Badge>
                      )}
                      {r.status === "usado" && (
                        <Badge className="bg-amber-600/80">Usado</Badge>
                      )}
                      {r.status === "desconocido" && (
                        <Badge variant="secondary" className="bg-white/10">Desconocido</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button
                className="btn-gradient btn-apple text-white"
                onClick={() => {
                  // Simulación de “registrar canje” del último válido
                  const lastValid = results.find(r => r.status === "valido");
                  if (!lastValid) return;
                  const ack: ScanResult = {
                    ...lastValid,
                    status: "usado", // demuéstrale al usuario que cambió a usado
                    timestamp: new Date().toISOString(),
                  };
                  setResults(prev => [ack, ...prev]);
                }}
              >
                Registrar canje (demo)
              </Button>

              <Button
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => setOpenQuickCreate(true)}
              >
                Crear promoción rápida
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal: crear promoción rápida (mock UI) */}
      <Dialog open={openQuickCreate} onOpenChange={setOpenQuickCreate}>
        <DialogContent className="glass-alt border border-white/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear promoción rápida</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input placeholder="Ej. 10% en mostrador" className="bg-white/10 border-white/30 text-white placeholder-white/60"/>
              </div>
              <div className="space-y-1">
                <Label>Porcentaje</Label>
                <Input type="number" step="0.01" placeholder="10.00" className="bg-white/10 border-white/30 text-white placeholder-white/60"/>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Descripción</Label>
                <Input placeholder="Detalles…" className="bg-white/10 border-white/30 text-white placeholder-white/60"/>
              </div>
            </div>
            <p className="text-xs text-white/60">
              *Este formulario es demostrativo. Enlaza con tu flujo real de <code>createPromocion</code> cuando esté listo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenQuickCreate(false)}>Cancelar</Button>
            <Button className="btn-gradient btn-apple text-white" onClick={() => setOpenQuickCreate(false)}>
              Guardar (demo)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
