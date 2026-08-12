<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expediente;
use App\Models\Historial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Resumen final en PDF del expediente. Se guarda en el disco privado: no se
 * sirve por URL pública, sólo a través de este controlador, que exige sesión y
 * el módulo de expedientes.
 */
class ResumenExpedienteController extends Controller
{
    private const DISCO = 'local';

    public function store(Request $request, Expediente $expediente)
    {
        $request->validate([
            'resumen' => 'required|file|mimetypes:application/pdf|max:10240',
        ], [
            'resumen.mimetypes' => 'El resumen debe ser un archivo PDF.',
            'resumen.max' => 'El PDF no puede superar los 10 MB.',
        ]);

        // Sustituir el anterior: el expediente tiene un único resumen final.
        $this->borrarArchivo($expediente);

        $archivo = $request->file('resumen');
        $ruta = $archivo->store("expedientes/{$expediente->id}", self::DISCO);

        $expediente->update([
            'resumen_pdf_ruta' => $ruta,
            'resumen_pdf_nombre' => $archivo->getClientOriginalName(),
        ]);

        $this->registrar($request, $expediente, 'Carga de resumen PDF',
            "Resumen '{$archivo->getClientOriginalName()}' cargado en el expediente {$expediente->codigo}");

        return response()->json($expediente->fresh());
    }

    public function show(Expediente $expediente)
    {
        if (!$expediente->resumen_pdf_ruta || !Storage::disk(self::DISCO)->exists($expediente->resumen_pdf_ruta)) {
            return response()->json(['message' => 'El expediente no tiene un resumen cargado'], 404);
        }

        return Storage::disk(self::DISCO)->download(
            $expediente->resumen_pdf_ruta,
            $expediente->resumen_pdf_nombre ?: 'resumen.pdf',
            ['Content-Type' => 'application/pdf'],
        );
    }

    /**
     * Quita el adjunto, no el expediente: el registro del caso sigue intacto y
     * la retirada queda en el historial.
     */
    public function destroy(Request $request, Expediente $expediente)
    {
        $nombre = $expediente->resumen_pdf_nombre;
        $this->borrarArchivo($expediente);

        $expediente->update(['resumen_pdf_ruta' => null, 'resumen_pdf_nombre' => null]);

        $this->registrar($request, $expediente, 'Retiro de resumen PDF',
            "Resumen '{$nombre}' retirado del expediente {$expediente->codigo}");

        return response()->json($expediente->fresh());
    }

    private function borrarArchivo(Expediente $expediente): void
    {
        if ($expediente->resumen_pdf_ruta) {
            Storage::disk(self::DISCO)->delete($expediente->resumen_pdf_ruta);
        }
    }

    private function registrar(Request $request, Expediente $expediente, string $accion, string $detalles): void
    {
        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => $accion,
            'modulo' => 'expedientes',
            'registro_tipo' => 'Expediente',
            'registro_id' => $expediente->id,
            'detalles' => $detalles,
            'ip_address' => $request->ip(),
        ]);
    }
}
