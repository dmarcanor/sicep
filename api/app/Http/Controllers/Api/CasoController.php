<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Caso;
use App\Models\Historial;
use App\Support\Correlativo;
use Illuminate\Http\Request;

class CasoController extends Controller
{
    public function index(Request $request)
    {
        $query = Caso::with(['expediente.nna', 'expediente.representante', 'asignadoA', 'asignadoPor']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('motivo', 'like', "%{$search}%")
                  ->orWhereHas('expediente', function ($e) use ($search) {
                      $e->where('codigo', 'like', "%{$search}%")
                        ->orWhere('sector', 'like', "%{$search}%")
                        ->orWhere('tipificacion', 'like', "%{$search}%")
                        ->orWhereHas('nna', function ($n) use ($search) {
                            $n->where('nombres', 'like', "%{$search}%")
                              ->orWhere('apellidos', 'like', "%{$search}%")
                              ->orWhereRaw("CONCAT(nombres, ' ', apellidos) like ?", ["%{$search}%"]);
                        });
                  })
                  ->orWhereHas('asignadoA', function ($u) use ($search) {
                      $u->where('name', 'like', "%{$search}%")
                        ->orWhere('display_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('estatus')) {
            $query->where('estatus', $request->estatus);
        }

        if ($request->has('asignado_a')) {
            $query->where('asignado_a', $request->asignado_a);
        }

        return response()->json($query->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'expediente_id' => 'required|exists:expedientes,id',
            'asignado_a' => 'required|exists:users,id',
            'motivo' => 'nullable|string',
            'tipo_asignacion' => 'nullable|in:Rotativa,Manual',
        ]);

        $datos['asignado_por'] = $request->user()->id;
        $datos['estatus'] = 'Pendiente';

        $caso = Correlativo::crear(Caso::class, 'CASO-', $datos);
        $codigo = $caso->codigo;

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Asignación de caso',
            'modulo' => 'asignacionCasos',
            'registro_tipo' => 'Caso',
            'registro_id' => $caso->id,
            'detalles' => "Caso {$codigo} asignado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($caso->load(['expediente.nna', 'expediente.representante', 'asignadoA', 'asignadoPor']), 201);
    }

    public function show(Caso $caso)
    {
        return response()->json($caso->load(['expediente.nna', 'expediente.representante', 'asignadoA', 'asignadoPor']));
    }

    public function update(Request $request, Caso $caso)
    {
        $datos = $request->validate([
            'estatus' => 'sometimes|in:Pendiente,En proceso,Resuelto,Cerrado',
            'observaciones' => 'sometimes|nullable|string',
            'asignado_a' => 'sometimes|exists:users,id',
            'tipo_asignacion' => 'sometimes|in:Rotativa,Manual',
        ]);

        $caso->update($datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de caso',
            'modulo' => 'asignacionCasos',
            'registro_tipo' => 'Caso',
            'registro_id' => $caso->id,
            'detalles' => "Caso {$caso->codigo} actualizado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($caso->load(['expediente.nna', 'expediente.representante', 'asignadoA', 'asignadoPor']));
    }
}
