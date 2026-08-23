<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Caso;
use App\Models\Expediente;
use App\Models\SolicitudArchivo;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReporteController extends Controller
{
    /**
     * Indicadores del período seleccionado, todos calculados sobre la base.
     *
     * No se compara con ningún tramo anterior: la documentación pide
     * "tendencias temporales", que resuelve el propio selector de período.
     */
    public function index(Request $request)
    {
        $request->validate([
            'desde' => 'nullable|date',
            'hasta' => 'nullable|date|after_or_equal:desde',
            'tipificacion' => 'nullable|string|max:120',
            'sector' => 'nullable|string|max:120',
        ]);

        $tipificacion = $request->filled('tipificacion') ? $request->tipificacion : null;
        $sector = $request->filled('sector') ? $request->sector : null;

        $hasta = $request->filled('hasta')
            ? Carbon::parse($request->hasta)->endOfDay()
            : Carbon::now()->endOfMonth()->endOfDay();

        $desde = $request->filled('desde')
            ? Carbon::parse($request->desde)->startOfDay()
            : Carbon::now()->startOfMonth()->startOfDay();

        $dias = (int) $desde->copy()->startOfDay()
            ->diffInDays($hasta->copy()->startOfDay()) + 1;

        return response()->json([
            'periodo' => [
                'desde' => $desde->toDateString(),
                'hasta' => $hasta->toDateString(),
                'dias' => $dias,
            ],
            'filtros' => [
                'tipificacion' => $tipificacion,
                'sector' => $sector,
                'tipificaciones' => Expediente::query()->whereNotNull('tipificacion')
                    ->distinct()->orderBy('tipificacion')->pluck('tipificacion'),
                'sectores' => Expediente::query()->whereNotNull('sector')
                    ->distinct()->orderBy('sector')->pluck('sector'),
            ],
            'expedientes' => $this->expedientes($desde, $hasta, $tipificacion, $sector),
            'resolucion' => $this->resolucion($desde, $hasta, $tipificacion, $sector),
            'casos' => $this->agrupado(Caso::query(), $desde, $hasta, $tipificacion, $sector),
            'solicitudes' => $this->agrupado(SolicitudArchivo::query(), $desde, $hasta, $tipificacion, $sector),
        ]);
    }

    /**
     * Recorta la consulta al motivo o al sector elegido. Sin esto el módulo
     * sólo sabía hablar en general, y lo que se necesita es poder mirar una
     * vulneración concreta.
     */
    private function acotar($query, ?string $tipificacion, ?string $sector)
    {
        return $query
            ->when($tipificacion, fn ($q) => $q->where('tipificacion', $tipificacion))
            ->when($sector, fn ($q) => $q->where('sector', $sector));
    }

    private function enPeriodo($query, Carbon $desde, Carbon $hasta)
    {
        return $query->whereBetween('fecha', [$desde->toDateString(), $hasta->toDateString()]);
    }

    private function expedientes(Carbon $desde, Carbon $hasta, ?string $tipificacion, ?string $sector): array
    {
        $base = fn () => $this->acotar($this->enPeriodo(Expediente::query(), $desde, $hasta), $tipificacion, $sector);

        return [
            'total' => $base()->count(),
            'total_cerrados' => $base()->where('estatus', 'Cerrado')->count(),
            'por_estatus' => $base()->selectRaw('estatus, count(*) as total')->groupBy('estatus')->get(),
            'por_prioridad' => $base()->selectRaw('prioridad, count(*) as total')->groupBy('prioridad')->get(),
            'por_sector' => $base()->selectRaw('sector, count(*) as total')->groupBy('sector')->orderByDesc('total')->get(),
            'por_tipificacion' => $base()->whereNotNull('tipificacion')
                ->selectRaw('tipificacion, count(*) as total')->groupBy('tipificacion')->orderByDesc('total')->get(),
        ];
    }

    /**
     * Tiempo medio entre la fecha del expediente y su cierre efectivo. Se dice
     * cuántos entran en la media: sin esa cifra el número no es interpretable.
     */
    private function resolucion(Carbon $desde, Carbon $hasta, ?string $tipificacion, ?string $sector): array
    {
        $cerrados = $this->acotar(
            Expediente::query()
                ->whereNotNull('cerrado_en')
                ->whereBetween('cerrado_en', [$desde, $hasta]),
            $tipificacion,
            $sector,
        );

        $promedio = (clone $cerrados)->selectRaw('AVG(DATEDIFF(cerrado_en, fecha)) as dias')->value('dias');

        return [
            'expedientes_cerrados' => (clone $cerrados)->count(),
            'dias_promedio' => $promedio === null ? null : round((float) $promedio, 1),
        ];
    }

    private function agrupado($query, Carbon $desde, Carbon $hasta, ?string $tipificacion, ?string $sector): array
    {
        $base = fn () => (clone $query)
            ->whereBetween('created_at', [$desde, $hasta])
            ->when(
                $tipificacion || $sector,
                fn ($q) => $q->whereHas('expediente', fn ($e) => $this->acotar($e, $tipificacion, $sector)),
            );

        return [
            'total' => $base()->count(),
            'por_estatus' => $base()->selectRaw('estatus, count(*) as total')->groupBy('estatus')->get(),
        ];
    }
}
