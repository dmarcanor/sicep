<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bitacora;
use App\Models\Caso;
use App\Models\Configuracion;
use App\Models\Documento;
use App\Models\Expediente;
use App\Models\Historial;
use App\Models\Nna;
use App\Models\ObservacionExpediente;
use App\Models\Plantilla;
use App\Models\Representante;
use App\Models\SolicitudArchivo;
use App\Models\User;
use App\Support\ValoresHistorial;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HistorialController extends Controller
{
    private const POR_PAGINA = 25;
    private const MAXIMO_POR_PAGINA = 100;

    /** Registros que admiten una línea de tiempo propia. */
    private const TIPOS_REGISTRO = [
        'Expediente', 'Nna', 'Representante', 'Documento', 'Caso',
        'SolicitudArchivo', 'Plantilla', 'User', 'Configuracion',
    ];

    /** Modelo de cada tipo de registro y, si hace falta, la relación para nombrarlo. */
    private const REFERENCIAS = [
        'Expediente' => [Expediente::class, null],
        'Caso' => [Caso::class, null],
        'SolicitudArchivo' => [SolicitudArchivo::class, null],
        'Documento' => [Documento::class, null],
        'Plantilla' => [Plantilla::class, null],
        'Configuracion' => [Configuracion::class, null],
        'User' => [User::class, null],
        'Nna' => [Nna::class, null],
        'Representante' => [Representante::class, null],
        'Bitacora' => [Bitacora::class, 'expediente'],
        'ObservacionExpediente' => [ObservacionExpediente::class, 'expediente'],
    ];

    private const CABECERAS_CSV = [
        'Fecha', 'Usuario', 'Nombre', 'Acción', 'Módulo', 'Registro', 'Estado',
        'Campo', 'Valor anterior', 'Valor nuevo', 'IP', 'Detalles',
    ];

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

        $pagina = $query->with(['usuario', 'cambios'])->orderByDesc('id')
            ->paginate($porPagina, ['*'], 'pagina');

        $this->anotarReferencias(collect($pagina->items()));
        $this->resolverValores(collect($pagina->items()));

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

    /** Todo lo que ha pasado con un registro concreto, en orden cronológico. */
    public function porRegistro(string $tipo, int $id)
    {
        abort_unless(in_array($tipo, self::TIPOS_REGISTRO, true), 404, 'Tipo de registro desconocido.');

        $consulta = Historial::query()->where(function ($q) use ($tipo, $id) {
            $q->where(fn ($r) => $r->where('registro_tipo', $tipo)->where('registro_id', $id));

            // La línea de tiempo de un expediente incluye sus observaciones y
            // sus actuaciones de bitácora, que se registran por separado.
            if ($tipo === 'Expediente') {
                $q->orWhere(fn ($r) => $r->where('registro_tipo', 'ObservacionExpediente')
                    ->whereIn('registro_id', ObservacionExpediente::where('expediente_id', $id)->select('id')));

                $q->orWhere(fn ($r) => $r->where('registro_tipo', 'Bitacora')
                    ->whereIn('registro_id', Bitacora::where('expediente_id', $id)->select('id')));
            }
        });

        $entradas = $consulta->with(['usuario', 'cambios'])->orderBy('id')->get();

        $this->anotarReferencias($entradas);
        $this->resolverValores($entradas);

        return response()->json($entradas);
    }

    /** Exporta la consulta filtrada, una línea por cada campo cambiado. */
    public function exportar(Request $request): StreamedResponse
    {
        $consulta = $this->consultaFiltrada($request);

        return response()->streamDownload(function () use ($consulta) {
            $salida = fopen('php://output', 'w');
            fwrite($salida, "\xEF\xBB\xBF");
            fputcsv($salida, self::CABECERAS_CSV, ';');

            $consulta->reorder()->with(['usuario', 'cambios'])->chunkById(500, function ($entradas) use ($salida) {
                $this->anotarReferencias($entradas);
                $this->resolverValores($entradas);

                foreach ($entradas as $entrada) {
                    $base = [
                        $entrada->created_at?->format('Y-m-d H:i:s'),
                        $entrada->usuario?->username,
                        $entrada->usuario?->name,
                        $entrada->accion,
                        $entrada->modulo,
                        $entrada->referencia,
                        $entrada->estado,
                    ];
                    $cola = [$entrada->ip_address, $entrada->detalles];

                    if ($entrada->cambios->isEmpty()) {
                        fputcsv($salida, [...$base, null, null, null, ...$cola], ';');
                        continue;
                    }

                    foreach ($entrada->cambios as $cambio) {
                        fputcsv($salida, [...$base, $cambio->campo, $cambio->valor_anterior, $cambio->valor_nuevo, ...$cola], ';');
                    }
                }
            }, 'id');

            fclose($salida);
        }, 'historial-' . now()->format('Ymd-His') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Pone a cada entrada una referencia legible del registro afectado: el
     * código del expediente, del caso o de la solicitud, el título del
     * documento, el nombre de la persona, etc. Se consulta en lote por tipo
     * para no hacer una consulta por fila.
     */
    private function anotarReferencias(Collection $entradas): void
    {
        $nombres = [];

        foreach ($entradas->filter(fn ($e) => $e->registro_tipo && $e->registro_id)->groupBy('registro_tipo') as $tipo => $grupo) {
            if (!isset(self::REFERENCIAS[$tipo])) {
                continue;
            }

            [$modelo, $relacion] = self::REFERENCIAS[$tipo];
            $consulta = $modelo::query()->whereIn('id', $grupo->pluck('registro_id')->unique());

            if ($relacion) {
                $consulta->with($relacion);
            }

            foreach ($consulta->get() as $registro) {
                $nombres[$tipo][$registro->id] = $this->etiqueta($tipo, $registro);
            }
        }

        foreach ($entradas as $entrada) {
            $nombre = $nombres[$entrada->registro_tipo][$entrada->registro_id] ?? null;

            $entrada->setAttribute('referencia', $nombre
                ?? ($entrada->registro_tipo ? "{$entrada->registro_tipo} #{$entrada->registro_id}" : null));
        }
    }

    /** Cambia los IDs de claves foráneas por nombres en todas las filas. */
    private function resolverValores(Collection $entradas): void
    {
        ValoresHistorial::resolver($entradas->flatMap->cambios);
    }

    private function etiqueta(string $tipo, $registro): ?string
    {
        return match ($tipo) {
            'Expediente', 'Caso', 'SolicitudArchivo' => $registro->codigo,
            'Documento' => $registro->titulo,
            'Plantilla' => $registro->nombre,
            'Configuracion' => $registro->clave,
            'User' => $registro->username,
            'Nna', 'Representante' => trim("{$registro->nombres} {$registro->apellidos}"),
            'Bitacora', 'ObservacionExpediente' => $registro->expediente
                ? "Expediente {$registro->expediente->codigo}"
                : null,
            default => null,
        };
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
                  ->orWhere('registro_tipo', 'like', "%{$search}%")
                  ->orWhereHas('usuario', function ($u) use ($search) {
                      $u->where('name', 'like', "%{$search}%")
                        ->orWhere('display_name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                  });
            });
        }

        foreach (['modulo', 'accion', 'estado', 'usuario_id', 'registro_tipo'] as $campo) {
            if ($request->filled($campo)) {
                $query->where($campo, $request->input($campo));
            }
        }

        if ($request->filled('registro_id')) {
            $query->where('registro_id', $request->input('registro_id'));
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
            'usuarios' => User::query()->orderBy('name')->get(['id', 'name', 'username']),
        ];
    }
}
