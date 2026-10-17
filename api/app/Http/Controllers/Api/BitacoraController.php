<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bitacora;
use App\Models\Expediente;
use App\Support\Auditoria;
use App\Support\Jurisdiccion;
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
        abort_unless(
            Jurisdiccion::puedeRegistrarActuacion($request->user(), $expediente),
            403,
            'Sólo el consejero asignado al caso puede registrar actuaciones.',
        );

        $datos = $request->validate([
            'fecha' => 'required|date|before_or_equal:today',
            'nota' => 'required|string|max:2000',
        ], [
            'fecha.before_or_equal' => 'La fecha de la actuación no puede ser futura.',
        ]);

        $entrada = $expediente->bitacoras()->create($datos + [
            'usuario_id' => $request->user()->id,
        ]);

        Auditoria::registrar(
            $request,
            'Actuación en bitácora',
            'expedientes',
            "Actuación registrada en el expediente {$expediente->codigo}",
            $entrada,
            Auditoria::creacion($entrada),
        );

        return response()->json($entrada->load('usuario'), 201);
    }
}
