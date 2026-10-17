<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Caso;
use App\Models\User;
use App\Support\Auditoria;
use App\Support\Correlativo;
use App\Support\Jurisdiccion;
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

    /**
     * Lista de consejeros para asignar casos. Sale del módulo de asignación y
     * no del de usuarios, así que la secretaría puede repartir sin ver correos
     * ni gestionar cuentas.
     */
    public function consejeros()
    {
        return response()->json(
            User::where('role', 'consejero')
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'display_name', 'position'])
        );
    }

    public function store(Request $request)
    {
        abort_unless(
            Jurisdiccion::puedeReasignarCasos($request->user()),
            403,
            'Sólo la secretaría o el administrador pueden asignar casos.',
        );

        $datos = $request->validate([
            'expediente_id' => 'required|exists:expedientes,id',
            'asignado_a' => 'required|exists:users,id',
            'motivo' => 'nullable|string',
            'tipo_asignacion' => 'nullable|in:Rotativa,Manual',
        ]);

        $datos['asignado_por'] = $request->user()->id;
        $datos['estatus'] = 'Pendiente';

        $caso = Correlativo::crear(Caso::class, 'CASO-', $datos);

        Auditoria::registrar(
            $request,
            'Asignación de caso',
            'asignacionCasos',
            "Caso {$caso->codigo} asignado",
            $caso,
            Auditoria::creacion($caso),
        );

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

        if (array_key_exists('asignado_a', $datos) || array_key_exists('tipo_asignacion', $datos)) {
            abort_unless(
                Jurisdiccion::puedeReasignarCasos($request->user()),
                403,
                'Sólo la secretaría o el administrador pueden reasignar casos.',
            );
        }

        $cambios = Auditoria::actualizar($caso, $datos);

        Auditoria::registrar(
            $request,
            'Actualización de caso',
            'asignacionCasos',
            "Caso {$caso->codigo} actualizado",
            $caso,
            $cambios,
        );

        return response()->json($caso->load(['expediente.nna', 'expediente.representante', 'asignadoA', 'asignadoPor']));
    }
}
