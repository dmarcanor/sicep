<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expediente;
use App\Support\Auditoria;
use App\Support\Jurisdiccion;
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
        $this->exigirEdicion($request, $expediente);

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

        $cambios = Auditoria::actualizar($expediente, [
            'resumen_pdf_ruta' => $ruta,
            'resumen_pdf_nombre' => $archivo->getClientOriginalName(),
        ]);

        $this->registrar($request, $expediente, 'Carga de resumen PDF',
            "Resumen '{$archivo->getClientOriginalName()}' cargado en el expediente {$expediente->codigo}",
            $cambios);

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
        $this->exigirEdicion($request, $expediente);

        $nombre = $expediente->resumen_pdf_nombre;
        $this->borrarArchivo($expediente);

        $cambios = Auditoria::actualizar($expediente, [
            'resumen_pdf_ruta' => null,
            'resumen_pdf_nombre' => null,
        ]);

        $this->registrar($request, $expediente, 'Retiro de resumen PDF',
            "Resumen '{$nombre}' retirado del expediente {$expediente->codigo}", $cambios);

        return response()->json($expediente->fresh());
    }

    private function exigirEdicion(Request $request, Expediente $expediente): void
    {
        abort_unless(
            Jurisdiccion::puedeGestionarArchivoFisico($request->user(), $expediente),
            403,
            'No tiene permiso para modificar el resumen de este expediente.',
        );
    }

    private function borrarArchivo(Expediente $expediente): void
    {
        if ($expediente->resumen_pdf_ruta) {
            Storage::disk(self::DISCO)->delete($expediente->resumen_pdf_ruta);
        }
    }

    private function registrar(Request $request, Expediente $expediente, string $accion, string $detalles, array $cambios = []): void
    {
        Auditoria::registrar($request, $accion, 'expedientes', $detalles, $expediente, $cambios);
    }
}
