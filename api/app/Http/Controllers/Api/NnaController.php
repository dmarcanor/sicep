<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historial;
use App\Models\Nna;
use Illuminate\Http\Request;

class NnaController extends Controller
{
    public function index(Request $request)
    {
        $query = Nna::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%")
                  ->orWhere('documento_identidad', 'like', "%{$search}%");
            });
        }

        // La columna "Expedientes" del listado se alimenta de este conteo; sin él
        // la relación no viaja y siempre se muestra 0.
        return response()->json(
            $query->withCount('expedientes')->orderByDesc('id')->get()
        );
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'documento_identidad' => 'required|string|unique:nna',
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'fecha_nacimiento' => 'required|date|before_or_equal:today',
            'sexo' => 'required|in:Masculino,Femenino',
            'lugar_nacimiento' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
        ], [
            'fecha_nacimiento.before_or_equal' => 'La fecha de nacimiento no puede ser futura.',
        ]);

        $nna = Nna::create($datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Registro de NNA',
            'modulo' => 'nna',
            'registro_tipo' => 'Nna',
            'registro_id' => $nna->id,
            'detalles' => "NNA {$nna->nombres} {$nna->apellidos} registrado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($nna, 201);
    }

    public function show(Nna $nna)
    {
        return response()->json($nna->load('expedientes'));
    }

    public function update(Request $request, Nna $nna)
    {
        $datos = $request->validate([
            'documento_identidad' => 'sometimes|string|unique:nna,documento_identidad,' . $nna->id,
            'nombres' => 'sometimes|string|max:255',
            'apellidos' => 'sometimes|string|max:255',
            'fecha_nacimiento' => 'sometimes|date|before_or_equal:today',
            'sexo' => 'sometimes|in:Masculino,Femenino',
            'lugar_nacimiento' => 'sometimes|nullable|string|max:255',
            'observaciones' => 'sometimes|nullable|string',
        ], [
            'fecha_nacimiento.before_or_equal' => 'La fecha de nacimiento no puede ser futura.',
        ]);

        $nna->update($datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de NNA',
            'modulo' => 'nna',
            'registro_tipo' => 'Nna',
            'registro_id' => $nna->id,
            'detalles' => "NNA {$nna->nombres} {$nna->apellidos} actualizado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($nna);
    }

    public function verificarDocumento($documento)
    {
        $nna = Nna::where('documento_identidad', $documento)->with('expedientes')->first();
        
        return response()->json([
            'existe' => $nna !== null,
            'nna' => $nna,
            'tiene_historial' => $nna && $nna->expedientes->count() > 0,
            'cantidad_expedientes' => $nna ? $nna->expedientes->count() : 0,
        ]);
    }
}
