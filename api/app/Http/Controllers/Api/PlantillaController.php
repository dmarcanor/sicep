<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plantilla;
use App\Models\Historial;
use Illuminate\Http\Request;

class PlantillaController extends Controller
{
    public function index()
    {
        return response()->json(Plantilla::with('creadoPor')->where('activa', true)->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|max:100',
            'contenido' => 'required|string',
        ]);

        $plantilla = Plantilla::create([
            'nombre' => $request->nombre,
            'tipo' => $request->tipo,
            'contenido' => $request->contenido,
            'creado_por' => $request->user()->id,
            'activa' => true,
        ]);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Creación de plantilla',
            'modulo' => 'plantillas',
            'registro_tipo' => 'Plantilla',
            'registro_id' => $plantilla->id,
            'detalles' => "Plantilla '{$plantilla->nombre}' creada",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($plantilla->load('creadoPor'), 201);
    }

    public function show(Plantilla $plantilla)
    {
        return response()->json($plantilla->load('creadoPor'));
    }

    public function update(Request $request, Plantilla $plantilla)
    {
        $datos = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'tipo' => 'sometimes|string|max:100',
            'contenido' => 'sometimes|string',
            'activa' => 'sometimes|boolean',
        ]);

        $plantilla->update($datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de plantilla',
            'modulo' => 'plantillas',
            'registro_tipo' => 'Plantilla',
            'registro_id' => $plantilla->id,
            'detalles' => "Plantilla '{$plantilla->nombre}' actualizada",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($plantilla->load('creadoPor'));
    }

}
