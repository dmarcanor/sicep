<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SolicitudArchivo;
use App\Models\Historial;
use Illuminate\Http\Request;

class SolicitudArchivoController extends Controller
{
    public function index(Request $request)
    {
        $query = SolicitudArchivo::with(['expediente', 'solicitante']);

        if ($request->has('estatus')) {
            $query->where('estatus', $request->estatus);
        }

        if ($request->has('solicitante_id')) {
            $query->where('solicitante_id', $request->solicitante_id);
        }

        return response()->json($query->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'expediente_id' => 'required|exists:expedientes,id',
            'documentos_solicitados' => 'required|string',
        ]);

        $codigo = 'SOL-' . str_pad(SolicitudArchivo::max('id') + 1 ?? 1, 6, '0', STR_PAD_LEFT);

        $solicitud = SolicitudArchivo::create([
            'codigo' => $codigo,
            'expediente_id' => $request->expediente_id,
            'solicitante_id' => $request->user()->id,
            'documentos_solicitados' => $request->documentos_solicitados,
            'estatus' => 'Pendiente',
        ]);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Solicitud de archivo',
            'modulo' => 'solicitudArchivos',
            'registro_tipo' => 'SolicitudArchivo',
            'registro_id' => $solicitud->id,
            'detalles' => "Solicitud {$codigo} creada",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($solicitud->load(['expediente', 'solicitante']), 201);
    }

    public function show(SolicitudArchivo $solicitudArchivo)
    {
        return response()->json($solicitudArchivo->load(['expediente', 'solicitante']));
    }

    public function update(Request $request, SolicitudArchivo $solicitudArchivo)
    {
        $request->validate([
            'estatus' => 'sometimes|in:Pendiente,En proceso,Completado,Rechazado',
            'observaciones' => 'nullable|string',
            'fecha_entrega' => 'nullable|date',
        ]);

        $solicitudArchivo->update($request->all());

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de solicitud',
            'modulo' => 'solicitudArchivos',
            'registro_tipo' => 'SolicitudArchivo',
            'registro_id' => $solicitudArchivo->id,
            'detalles' => "Solicitud {$solicitudArchivo->codigo} actualizada",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($solicitudArchivo->load(['expediente', 'solicitante']));
    }
}
