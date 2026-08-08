<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expediente;
use App\Models\Historial;
use Illuminate\Http\Request;

class ExpedienteController extends Controller
{
    public function index(Request $request)
    {
        $query = Expediente::with(['nna', 'representante', 'registradoPor', 'asignadoA']);

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
        $request->validate([
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

        $codigo = 'SICEP-URD-' . str_pad(Expediente::max('id') + 1 ?? 1, 6, '0', STR_PAD_LEFT);

        $expediente = Expediente::create([
            'nna_id' => $request->nna_id,
            'representante_id' => $request->representante_id,
            'codigo' => $codigo,
            'fecha' => $request->fecha,
            'hora_registro' => $request->hora_registro ?? now()->format('H:i:s'),
            'sector' => $request->sector,
            'prioridad' => $request->prioridad,
            'tipificacion' => $request->tipificacion,
            'causa' => $request->causa,
            'observaciones' => $request->observaciones,
            'registrado_por' => $request->user()->id,
            'estatus' => 'Registrado',
        ]);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Creación de expediente',
            'modulo' => 'expedientes',
            'registro_tipo' => 'Expediente',
            'registro_id' => $expediente->id,
            'detalles' => "Expediente {$codigo} creado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($expediente->load(['nna', 'representante', 'registradoPor', 'asignadoA']), 201);
    }

    public function show(Expediente $expediente)
    {
        return response()->json($expediente->load(['nna', 'representante', 'registradoPor', 'asignadoA', 'casos', 'solicitudesArchivo']));
    }

    public function update(Request $request, Expediente $expediente)
    {
        $request->validate([
            'nna_id' => 'sometimes|exists:nna,id',
            'representante_id' => 'sometimes|exists:representantes,id',
            // update() hace update($request->all()) y 'fecha' es asignable: sin
            // esta regla se podía cambiar a cualquier valor desde la edición.
            'fecha' => 'sometimes|date|before_or_equal:today',
            'sector' => 'sometimes|string|max:255',
            'estatus' => 'sometimes|in:Registrado,En revisión,Aprobado,Observado,Cerrado',
            'prioridad' => 'sometimes|in:Alta,Media,Baja',
            'tipificacion' => 'nullable|in:Maltrato Físico,Abuso Sexual,Negligencia,Acoso Escolar,Trabajo Infantil,Violencia Psicológica,Abandono,Explotación,Otro',
            'causa' => 'nullable|string',
            'observaciones' => 'nullable|string',
            'asignado_a' => 'nullable|exists:users,id',
        ], [
            'fecha.before_or_equal' => 'La fecha del expediente no puede ser futura.',
        ]);

        $expediente->update($request->all());

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de expediente',
            'modulo' => 'expedientes',
            'registro_tipo' => 'Expediente',
            'registro_id' => $expediente->id,
            'detalles' => "Expediente {$expediente->codigo} actualizado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($expediente->load(['nna', 'representante', 'registradoPor', 'asignadoA']));
    }

    public function destroy(Request $request, Expediente $expediente)
    {
        $codigo = $expediente->codigo;
        $expediente->delete();

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Eliminación de expediente',
            'modulo' => 'expedientes',
            'registro_tipo' => 'Expediente',
            'registro_id' => $codigo,
            'detalles' => "Expediente {$codigo} eliminado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Expediente eliminado']);
    }
}
