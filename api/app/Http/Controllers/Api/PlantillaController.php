<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plantilla;
use App\Support\Auditoria;
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

        Auditoria::registrar(
            $request,
            'Creación de plantilla',
            'plantillas',
            "Plantilla '{$plantilla->nombre}' creada",
            $plantilla,
            Auditoria::creacion($plantilla),
        );

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

        $cambios = Auditoria::actualizar($plantilla, $datos);

        Auditoria::registrar(
            $request,
            'Actualización de plantilla',
            'plantillas',
            "Plantilla '{$plantilla->nombre}' actualizada",
            $plantilla,
            $cambios,
        );

        return response()->json($plantilla->load('creadoPor'));
    }

}
