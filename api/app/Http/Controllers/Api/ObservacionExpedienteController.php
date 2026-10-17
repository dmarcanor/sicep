<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bitacora;
use App\Models\Expediente;
use App\Models\ObservacionExpediente;
use App\Support\Auditoria;
use App\Support\Jurisdiccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ObservacionExpedienteController extends Controller
{
    public function index(Expediente $expediente)
    {
        return response()->json(
            $expediente->observacionesExpediente()->with('usuario')->orderByDesc('id')->get()
        );
    }

    /**
     * La observación queda en el expediente y en la bitácora en una sola
     * transacción: no puede existir una sin la otra.
     */
    public function store(Request $request, Expediente $expediente)
    {
        abort_unless(
            Jurisdiccion::puedeObservar($request->user()),
            403,
            'Sólo la secretaría o el administrador pueden registrar observaciones.',
        );

        $datos = $request->validate([
            'texto' => 'required|string|max:2000',
        ]);

        $observacion = DB::transaction(function () use ($request, $expediente, $datos) {
            $observacion = $expediente->observacionesExpediente()->create($datos + [
                'usuario_id' => $request->user()->id,
            ]);

            Bitacora::create([
                'expediente_id' => $expediente->id,
                'usuario_id' => $request->user()->id,
                'fecha' => now()->toDateString(),
                'nota' => $datos['texto'],
            ]);

            Auditoria::registrar(
                $request,
                'Observación de expediente',
                'expedientes',
                "Observación registrada en el expediente {$expediente->codigo}",
                $observacion,
                Auditoria::creacion($observacion),
            );

            return $observacion;
        });

        return response()->json($observacion->load('usuario'), 201);
    }
}
