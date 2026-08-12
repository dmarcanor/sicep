<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historial;
use Illuminate\Http\Request;

class HistorialController extends Controller
{
    private const POR_PAGINA = 25;
    private const MAXIMO_POR_PAGINA = 100;

    /**
     * El historial crece sin tope, así que se pagina en el servidor: antes se
     * devolvían las últimas 100 filas y el módulo filtraba sobre esa ventana,
     * de modo que buscar algo más antiguo simplemente no encontraba nada.
     */
    public function index(Request $request)
    {
        $query = $this->consultaFiltrada($request);

        $porPagina = min(
            max((int) $request->input('por_pagina', self::POR_PAGINA), 1),
            self::MAXIMO_POR_PAGINA,
        );

        $pagina = $query->with('usuario')->orderByDesc('id')
            ->paginate($porPagina, ['*'], 'pagina');

        return response()->json([
            'datos' => $pagina->items(),
            'total' => $pagina->total(),
            'pagina' => $pagina->currentPage(),
            'por_pagina' => $pagina->perPage(),
            'ultima_pagina' => $pagina->lastPage(),

            // Cuenta sobre el filtro activo, no sobre la página: las tarjetas
            // de resumen deben hablar de la consulta entera.
            'resumen' => $this->resumen($request),

            // Salen de toda la tabla para que los desplegables no se encojan
            // conforme se filtra o se cambia de página.
            'opciones' => $this->opciones(),
        ]);
    }

    private function consultaFiltrada(Request $request)
    {
        $query = Historial::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('accion', 'like', "%{$search}%")
                  ->orWhere('modulo', 'like', "%{$search}%")
                  ->orWhere('detalles', 'like', "%{$search}%")
                  ->orWhere('estado', 'like', "%{$search}%")
                  ->orWhereHas('usuario', function ($u) use ($search) {
                      $u->where('name', 'like', "%{$search}%")
                        ->orWhere('display_name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                  });
            });
        }

        foreach (['modulo', 'accion', 'estado', 'usuario_id'] as $campo) {
            if ($request->filled($campo)) {
                $query->where($campo, $request->input($campo));
            }
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        return $query;
    }

    private function resumen(Request $request): array
    {
        $porEstado = $this->consultaFiltrada($request)
            ->selectRaw('estado, count(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado');

        return [
            'total' => (int) $porEstado->sum(),
            'exitosos' => (int) $porEstado->get('Exitoso', 0),
            'errores' => (int) $porEstado->get('Error', 0),
            'pendientes' => (int) $porEstado->get('Pendiente', 0),
        ];
    }

    private function opciones(): array
    {
        return [
            'modulos' => Historial::query()->distinct()->orderBy('modulo')->pluck('modulo'),
            'acciones' => Historial::query()->distinct()->orderBy('accion')->pluck('accion'),
            'estados' => Historial::query()->distinct()->orderBy('estado')->pluck('estado'),
        ];
    }
}
