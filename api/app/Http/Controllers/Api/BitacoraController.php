<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bitacora;
use App\Models\Expediente;
use App\Models\Historial;
use Illuminate\Http\Request;

class BitacoraController extends Controller
{
    public function index(Expediente $expediente)
    {
        return response()->json(
            $expediente->bitacoras()->with('usuario')->orderBy('fecha')->orderBy('id')->get()
        );
    }

    public function store(Request $request, Expediente $expediente)
    {
        $datos = $request->validate([
            'fecha' => 'required|date|before_or_equal:today',
            'nota' => 'required|string|max:2000',
        ], [
            'fecha.before_or_equal' => 'La fecha de la actuación no puede ser futura.',
        ]);

        $entrada = $expediente->bitacoras()->create($datos + [
            'usuario_id' => $request->user()->id,
        ]);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actuación en bitácora',
            'modulo' => 'expedientes',
            'registro_tipo' => 'Expediente',
            'registro_id' => $expediente->id,
            'detalles' => "Actuación registrada en el expediente {$expediente->codigo}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($entrada->load('usuario'), 201);
    }
}
