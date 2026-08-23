<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Representante;
use App\Models\Historial;
use Illuminate\Http\Request;

class RepresentanteController extends Controller
{
    public function index(Request $request)
    {
        $query = Representante::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%")
                  ->orWhere('cedula', 'like', "%{$search}%");
            });
        }

        $representantes = $query->withCount('expedientes')->orderByDesc('id')->get();
        
        return response()->json($representantes);
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'cedula' => 'required|string|unique:representantes',
            'nombres' => 'required|string|max:25',
            'apellidos' => 'required|string|max:25',
            'telefono' => 'nullable|string|max:15',
            'direccion' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'profesion' => 'nullable|string|max:255',
            'lugar_trabajo' => 'nullable|string|max:255',
        ]);

        $representante = Representante::create($datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Registro de representante',
            'modulo' => 'representantes',
            'registro_tipo' => 'Representante',
            'registro_id' => $representante->id,
            'detalles' => "Representante {$representante->nombres} {$representante->apellidos} registrado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($representante, 201);
    }

    public function show(Representante $representante)
    {
        return response()->json($representante->load('expedientes'));
    }

    public function update(Request $request, Representante $representante)
    {
        $datos = $request->validate([
            'cedula' => 'sometimes|string|unique:representantes,cedula,' . $representante->id,
            'nombres' => 'sometimes|string|max:25',
            'apellidos' => 'sometimes|string|max:25',
            'telefono' => 'sometimes|nullable|string|max:15',
            'direccion' => 'sometimes|nullable|string',
            'email' => 'sometimes|nullable|email|max:255',
            'profesion' => 'sometimes|nullable|string|max:255',
            'lugar_trabajo' => 'sometimes|nullable|string|max:255',
        ]);

        $representante->update($datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de representante',
            'modulo' => 'representantes',
            'registro_tipo' => 'Representante',
            'registro_id' => $representante->id,
            'detalles' => "Representante {$representante->nombres} {$representante->apellidos} actualizado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($representante);
    }

    public function buscarPorCedula($cedula)
    {
        $representante = Representante::where('cedula', $cedula)->with('expedientes')->first();
        
        return response()->json([
            'existe' => $representante !== null,
            'representante' => $representante,
            'tiene_expedientes' => $representante && $representante->expedientes->count() > 0,
            'cantidad_expedientes' => $representante ? $representante->expedientes->count() : 0,
        ]);
    }
}
