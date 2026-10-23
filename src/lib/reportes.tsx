import { createContext, use, useRef, useState, type ReactNode } from 'react';

import { programarAvisoDeResolucion } from '@/lib/notificaciones';
import { consultarPermiso } from '@/lib/permisos';
import type { Ubicacion } from '@/lib/ubicacion';

export const CATEGORIAS = ['electricidad', 'agua', 'mobiliario', 'equipos'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export type EstadoReporte = 'pendiente' | 'en curso' | 'resuelto';

export type Reporte = {
  id: string;
  titulo: string;
  descripcion: string;
  aula: string;
  categoria: Categoria;
  fotoUri: string | null;
  ubicacion: Ubicacion | null;
  sector: string | null;
  estado: EstadoReporte;
  creado: number;
};

export type Borrador = Omit<Reporte, 'id' | 'estado' | 'creado'>;

export type Aviso = {
  id: string;
  reporteId: string;
  titulo: string;
  mensaje: string;
  /** true si además se mandó como notificación del sistema. */
  notificado: boolean;
  fecha: number;
};

const BORRADOR_VACIO: Borrador = {
  titulo: '',
  descripcion: '',
  aula: '',
  categoria: 'electricidad',
  fotoUri: null,
  ubicacion: null,
  sector: null,
};

/** Segundos que tarda la "resolución" simulada. */
export const SEGUNDOS_RESOLUCION = 10;

type ContextoReportes = {
  reportes: Reporte[];
  avisos: Aviso[];
  borrador: Borrador;
  actualizarBorrador: (cambios: Partial<Borrador>) => void;
  guardarBorrador: () => Reporte;
  simularResolucion: (id: string) => Promise<void>;
  avisarAlResolver: boolean;
  setAvisarAlResolver: (valor: boolean) => void;
};

const Contexto = createContext<ContextoReportes | null>(null);

function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function ReportesProvider({ children }: { children: ReactNode }) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [borrador, setBorrador] = useState<Borrador>(BORRADOR_VACIO);
  const [avisarAlResolver, setAvisarAlResolver] = useState(false);
  // simularResolucion necesita el valor actual aunque cambie durante los 10 segundos.
  const avisarRef = useRef(avisarAlResolver);

  function cambiarAvisarAlResolver(valor: boolean) {
    avisarRef.current = valor;
    setAvisarAlResolver(valor);
  }

  function actualizarBorrador(cambios: Partial<Borrador>) {
    setBorrador((actual) => ({ ...actual, ...cambios }));
  }

  function guardarBorrador() {
    const reporte: Reporte = { ...borrador, id: nuevoId(), estado: 'pendiente', creado: Date.now() };
    setReportes((actuales) => [reporte, ...actuales]);
    setBorrador(BORRADOR_VACIO);
    return reporte;
  }

  function cambiarEstado(id: string, estado: EstadoReporte) {
    setReportes((actuales) => actuales.map((r) => (r.id === id ? { ...r, estado } : r)));
  }

  async function simularResolucion(id: string) {
    const reporte = reportes.find((r) => r.id === id);
    if (!reporte) return;
    cambiarEstado(id, 'en curso');

    // Notificación del sistema solo si la persona la pidió y el permiso está concedido.
    let notificado = false;
    if (avisarRef.current) {
      const { estado } = await consultarPermiso('notificaciones');
      if (estado === 'concedido') {
        await programarAvisoDeResolucion(reporte.titulo, SEGUNDOS_RESOLUCION);
        notificado = true;
      }
    }

    // La bandeja de avisos es la alternativa: el aviso llega siempre, haya permiso o no.
    setTimeout(() => {
      cambiarEstado(id, 'resuelto');
      setAvisos((actuales) => [
        {
          id: nuevoId(),
          reporteId: id,
          titulo: 'Reporte resuelto',
          mensaje: `"${reporte.titulo}" ya fue resuelto por Mantenimiento.`,
          notificado,
          fecha: Date.now(),
        },
        ...actuales,
      ]);
    }, SEGUNDOS_RESOLUCION * 1000);
  }

  return (
    <Contexto
      value={{
        reportes,
        avisos,
        borrador,
        actualizarBorrador,
        guardarBorrador,
        simularResolucion,
        avisarAlResolver,
        setAvisarAlResolver: cambiarAvisarAlResolver,
      }}>
      {children}
    </Contexto>
  );
}

export function useReportes() {
  const contexto = use(Contexto);
  if (!contexto) throw new Error('useReportes debe usarse dentro de <ReportesProvider>');
  return contexto;
}
