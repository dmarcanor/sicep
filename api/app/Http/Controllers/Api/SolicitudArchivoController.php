<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SolicitudArchivo;
use App\Models\Historial;
use App\Support\Correlativo;
use Illuminate\Http\Request;

class SolicitudArchivoController extends Controller
{
    // Debe coincidir con el enum de solicitudes_archivo.estatus: al ciclo de la
    // petición se suman los estados del expediente físico.
    private const ESTATUS = 'Pendiente,En proceso,Completado,Rechazado,Disponible,'
        . 'Reservado,Prestado,Devuelto,En consulta,Extraviado,En digitalización';

    public function index(Request $request)
    {
        $query = SolicitudArchivo::with(['expediente.nna', 'expediente.representante', 'solicitante']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('caso', 'like', "%{$search}%")
                  ->orWhere('solicitante_nombre', 'like', "%{$search}%")
                  ->orWhere('cargo', 'like', "%{$search}%")
                  ->orWhere('motivo', 'like', "%{$search}%")
                  ->orWhere('ubicacion_archivo', 'like', "%{$search}%")
                  ->orWhereHas('expediente', function ($e) use ($search) {
                      $e->where('codigo', 'like', "%{$search}%")
                        ->orWhereHas('nna', function ($n) use ($search) {
                            $n->where('nombres', 'like', "%{$search}%")
                              ->orWhere('apellidos', 'like', "%{$search}%")
                              ->orWhereRaw("CONCAT(nombres, ' ', apellidos) like ?", ["%{$search}%"]);
                        });
                  });
            });
        }

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
        $datos = $request->validate([
            'expediente_id' => 'required|exists:expedientes,id',
            'documentos_solicitados' => 'nullable|string',
            'observaciones' => 'nullable|string',
            'estatus' => 'nullable|in:' . self::ESTATUS,
            'solicitante_nombre' => 'required|string|max:255',
            'cargo' => 'nullable|string|max:255',
            'caso' => 'nullable|string|max:255',
            'motivo' => 'nullable|string',
            'fecha_solicitud' => 'required|date|before_or_equal:today',
            'fecha_prestamo' => 'nullable|date',
            'fecha_devolucion' => 'nullable|date',
            'ubicacion_archivo' => 'nullable|string|max:255',
            'ubicacion_estante' => 'nullable|string|max:255',
            'ubicacion_nivel' => 'nullable|string|max:255',
            'ubicacion_caja' => 'nullable|string|max:255',
        ], [
            'fecha_solicitud.before_or_equal' => 'La fecha de solicitud no puede ser futura.',
        ]);

        $datos['solicitante_id'] = $request->user()->id;
        $datos['estatus'] = $datos['estatus'] ?? 'Pendiente';

        $solicitud = Correlativo::crear(SolicitudArchivo::class, 'SOL-', $datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Solicitud de archivo',
            'modulo' => 'solicitudArchivos',
            'registro_tipo' => 'SolicitudArchivo',
            'registro_id' => $solicitud->id,
            'detalles' => "Solicitud {$solicitud->codigo} creada",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($solicitud->load(['expediente.nna', 'expediente.representante', 'solicitante']), 201);
    }

    // El parámetro debe llamarse igual que en la ruta ({solicitud}) o Eloquent
    // no enlaza el modelo y se inyecta uno vacío: show devolvía nada y update
    // respondía 200 sin guardar.
    public function show(SolicitudArchivo $solicitud)
    {
        return response()->json($solicitud->load(['expediente.nna', 'expediente.representante', 'solicitante']));
    }

    public function update(Request $request, SolicitudArchivo $solicitud)
    {
        $datos = $request->validate([
            'estatus' => 'sometimes|in:' . self::ESTATUS,
            'observaciones' => 'sometimes|nullable|string',
            'fecha_entrega' => 'sometimes|nullable|date',
            'fecha_prestamo' => 'sometimes|nullable|date',
            'fecha_devolucion' => 'sometimes|nullable|date',
            'ubicacion_archivo' => 'sometimes|nullable|string|max:255',
            'ubicacion_estante' => 'sometimes|nullable|string|max:255',
            'ubicacion_nivel' => 'sometimes|nullable|string|max:255',
            'ubicacion_caja' => 'sometimes|nullable|string|max:255',
        ]);

        $solicitud->update($datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de solicitud',
            'modulo' => 'solicitudArchivos',
            'registro_tipo' => 'SolicitudArchivo',
            'registro_id' => $solicitud->id,
            'detalles' => "Solicitud {$solicitud->codigo} actualizada",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($solicitud->load(['expediente.nna', 'expediente.representante', 'solicitante']));
    }
}
