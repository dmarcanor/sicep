<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expediente;
use App\Models\Caso;
use App\Models\SolicitudArchivo;
use Illuminate\Http\Request;

class PanelController extends Controller
{
    public function index()
    {
        $totalExpedientes = Expediente::count();
        $expedientesRecientes = Expediente::with(['registradoPor', 'asignadoA'])
            ->orderBy('fecha', 'desc')
            ->limit(5)
            ->get();

        $expedientesPorEstatus = Expediente::select('estatus')
            ->selectRaw('count(*) as total')
            ->groupBy('estatus')
            ->get();

        $totalCasos = Caso::count();
        $casosPendientes = Caso::where('estatus', 'Pendiente')->count();

        $totalSolicitudes = SolicitudArchivo::count();
        $solicitudesPendientes = SolicitudArchivo::where('estatus', 'Pendiente')->count();

        return response()->json([
            'total_expedientes' => $totalExpedientes,
            'expedientes_recientes' => $expedientesRecientes,
            'expedientes_por_estatus' => $expedientesPorEstatus,
            'total_casos' => $totalCasos,
            'casos_pendientes' => $casosPendientes,
            'total_solicitudes' => $totalSolicitudes,
            'solicitudes_pendientes' => $solicitudesPendientes,
        ]);
    }
}
