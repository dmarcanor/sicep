<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expediente;
use App\Models\Historial;
use App\Support\Correlativo;
use Illuminate\Http\Request;

class ExpedienteController extends Controller
{
    private const RELACIONES = ['nna', 'representante', 'registradoPor'];

    public function index(Request $request)
    {
        $query = Expediente::with(self::RELACIONES);

        if ($request->has('estatus')) {
            $query->where('estatus', $request->estatus);
        }

        if ($request->has('prioridad')) {
            $query->where('prioridad', $request->prioridad);
        }

        if ($request->has('tipificacion')) {
            $query->where('tipificacion', $request->tipificacion);
        }

        if ($request->has('sector')) {
            $query->where('sector', $request->sector);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhereHas('nna', function ($n) use ($search) {
                      $n->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%")
                        ->orWhereRaw("CONCAT(nombres, ' ', apellidos) like ?", ["%{$search}%"]);
                  })
                  ->orWhereHas('representante', function ($r) use ($search) {
                      $r->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('cedula', 'like', "%{$search}%")
                        ->orWhereRaw("CONCAT(nombres, ' ', apellidos) like ?", ["%{$search}%"]);
                  });
            });
        }

        return response()->json($query->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'nna_id' => 'required|exists:nna,id',
            'representante_id' => 'required|exists:representantes,id',
            'sector' => 'required|string|max:255',
            'fecha' => 'required|date|before_or_equal:today',
            'hora_registro' => 'nullable|date_format:H:i',
            'prioridad' => 'required|in:Alta,Media,Baja',
            'tipificacion' => 'nullable|in:Maltrato Físico,Abuso Sexual,Negligencia,Acoso Escolar,Trabajo Infantil,Violencia Psicológica,Abandono,Explotación,Otro',
            'causa' => 'nullable|string',
            'observaciones' => 'nullable|string',
        ], [
            'fecha.before_or_equal' => 'La fecha del expediente no puede ser futura.',
        ]);

        $datos['hora_registro'] = $datos['hora_registro'] ?? now()->format('H:i:s');
        $datos['registrado_por'] = $request->user()->id;
        $datos['estatus'] = 'Registrado';

        $expediente = Correlativo::crear(Expediente::class, 'SICEP-URD-', $datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Creación de expediente',
            'modulo' => 'expedientes',
            'registro_tipo' => 'Expediente',
            'registro_id' => $expediente->id,
            'detalles' => "Expediente {$expediente->codigo} creado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($expediente->load(self::RELACIONES), 201);
    }

    public function show(Expediente $expediente)
    {
        return response()->json(
            $expediente->load([...self::RELACIONES, 'casos', 'solicitudesArchivo'])
        );
    }

    public function update(Request $request, Expediente $expediente)
    {
        $datos = $request->validate([
            'nna_id' => 'sometimes|exists:nna,id',
            'representante_id' => 'sometimes|exists:representantes,id',
            // 'fecha' es asignable: sin esta regla se podía cambiar a cualquier
            // valor desde la edición.
            'fecha' => 'sometimes|date|before_or_equal:today',
            'sector' => 'sometimes|string|max:255',
            'estatus' => 'sometimes|in:Registrado,En revisión,Aprobado,Observado,Cerrado',
            'estatus_fisico' => 'sometimes|in:Pendiente,En Despacho,En Archivo Central',
            'prioridad' => 'sometimes|in:Alta,Media,Baja',
            'tipificacion' => 'sometimes|nullable|in:Maltrato Físico,Abuso Sexual,Negligencia,Acoso Escolar,Trabajo Infantil,Violencia Psicológica,Abandono,Explotación,Otro',
            'causa' => 'sometimes|nullable|string',
            'observaciones' => 'sometimes|nullable|string',
        ], [
            'fecha.before_or_equal' => 'La fecha del expediente no puede ser futura.',
        ]);

        $estatusPrevio = $expediente->estatus;

        if (array_key_exists('estatus', $datos) && $datos['estatus'] !== $estatusPrevio) {
            $datos['cerrado_en'] = $datos['estatus'] === 'Cerrado' ? now() : null;
        }

        // Sólo los campos validados: $request->all() dejaba entrar codigo y
        // registrado_por, que son asignables en el modelo.
        $expediente->update($datos);

        $detalle = "Expediente {$expediente->codigo} actualizado";
        if (array_key_exists('estatus', $datos) && $datos['estatus'] !== $estatusPrevio) {
            $detalle .= ": estatus {$estatusPrevio} → {$expediente->estatus}";
        }

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de expediente',
            'modulo' => 'expedientes',
            'registro_tipo' => 'Expediente',
            'registro_id' => $expediente->id,
            'detalles' => $detalle,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($expediente->load(self::RELACIONES));
    }
}
