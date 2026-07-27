<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expediente;
use App\Models\Caso;
use App\Models\SolicitudArchivo;
use Illuminate\Http\Request;

class ReporteController extends Controller
{
    public function index()
    {
        $totalExpedientes = Expediente::count();
        $totalCerrados = Expediente::where('estatus', 'Cerrado')->count();
        $expedientesPorEstatus = Expediente::select('estatus')->selectRaw('count(*) as total')->groupBy('estatus')->get();
        $expedientesPorPrioridad = Expediente::select('prioridad')->selectRaw('count(*) as total')->groupBy('prioridad')->get();
        $expedientesPorSector = Expediente::select('sector')->selectRaw('count(*) as total')->groupBy('sector')->get();
        $expedientesPorTipificacion = Expediente::select('tipificacion')->selectRaw('count(*) as total')->whereNotNull('tipificacion')->groupBy('tipificacion')->get();

        $totalCasos = Caso::count();
        $casosPorEstatus = Caso::select('estatus')->selectRaw('count(*) as total')->groupBy('estatus')->get();

        $totalSolicitudes = SolicitudArchivo::count();
        $solicitudesPorEstatus = SolicitudArchivo::select('estatus')->selectRaw('count(*) as total')->groupBy('estatus')->get();

        return response()->json([
            'expedientes' => [
                'total' => $totalExpedientes,
                'total_cerrados' => $totalCerrados,
                'por_estatus' => $expedientesPorEstatus,
                'por_prioridad' => $expedientesPorPrioridad,
                'por_sector' => $expedientesPorSector,
                'por_tipificacion' => $expedientesPorTipificacion,
            ],
            'casos' => [
                'total' => $totalCasos,
                'por_estatus' => $casosPorEstatus,
            ],
            'solicitudes' => [
                'total' => $totalSolicitudes,
                'por_estatus' => $solicitudesPorEstatus,
            ],
        ]);
    }
}
