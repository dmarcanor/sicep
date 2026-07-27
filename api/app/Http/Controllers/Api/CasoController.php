<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Caso;
use App\Models\Historial;
use Illuminate\Http\Request;

class CasoController extends Controller
{
    public function index(Request $request)
    {
        $query = Caso::with(['expediente', 'asignadoA', 'asignadoPor']);

        if ($request->has('estatus')) {
            $query->where('estatus', $request->estatus);
        }

        if ($request->has('asignado_a')) {
            $query->where('asignado_a', $request->asignado_a);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'expediente_id' => 'required|exists:expedientes,id',
            'asignado_a' => 'required|exists:users,id',
            'motivo' => 'nullable|string',
        ]);

        $codigo = 'CASO-' . str_pad(Caso::max('id') + 1 ?? 1, 6, '0', STR_PAD_LEFT);

        $caso = Caso::create([
            'codigo' => $codigo,
            'expediente_id' => $request->expediente_id,
            'asignado_a' => $request->asignado_a,
            'asignado_por' => $request->user()->id,
            'motivo' => $request->motivo,
            'estatus' => 'Pendiente',
        ]);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Asignación de caso',
            'modulo' => 'asignacionCasos',
            'registro_tipo' => 'Caso',
            'registro_id' => $caso->id,
            'detalles' => "Caso {$codigo} asignado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($caso->load(['expediente', 'asignadoA', 'asignadoPor']), 201);
    }

    public function show(Caso $caso)
    {
        return response()->json($caso->load(['expediente', 'asignadoA', 'asignadoPor']));
    }

    public function update(Request $request, Caso $caso)
    {
        $request->validate([
            'estatus' => 'sometimes|in:Pendiente,En proceso,Resuelto,Cerrado',
            'observaciones' => 'nullable|string',
        ]);

        $caso->update($request->all());

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de caso',
            'modulo' => 'asignacionCasos',
            'registro_tipo' => 'Caso',
            'registro_id' => $caso->id,
            'detalles' => "Caso {$caso->codigo} actualizado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($caso->load(['expediente', 'asignadoA', 'asignadoPor']));
    }
}
