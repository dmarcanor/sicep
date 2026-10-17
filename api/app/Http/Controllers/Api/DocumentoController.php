<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Documento;
use App\Support\Auditoria;
use App\Support\Jurisdiccion;
use Illuminate\Http\Request;

class DocumentoController extends Controller
{
    private const RELACIONES = ['expediente.nna', 'expediente.representante', 'creadoPor'];

    public function index(Request $request)
    {
        $query = Documento::with(self::RELACIONES);

        foreach (['expediente_id', 'estado', 'plantilla'] as $campo) {
            if ($request->filled($campo)) {
                $query->where($campo, $request->input($campo));
            }
        }

        return response()->json($query->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $datos = $this->validar($request);

        $documento = Documento::create($datos + [
            'creado_por' => $request->user()->id,
            'estado' => 'Borrador',
        ]);

        Auditoria::registrar(
            $request,
            'Creación de documento',
            'plantillas',
            "Borrador '{$documento->titulo}' creado",
            $documento,
            Auditoria::creacion($documento),
        );

        return response()->json($documento->load(self::RELACIONES), 201);
    }

    public function update(Request $request, Documento $documento)
    {
        $this->rechazarSiEmitido($documento);
        $this->exigirModificacion($request, $documento);

        $cambios = Auditoria::actualizar($documento, $this->validar($request));

        Auditoria::registrar(
            $request,
            'Actualización de documento',
            'plantillas',
            "Borrador '{$documento->titulo}' actualizado",
            $documento,
            $cambios,
        );

        return response()->json($documento->load(self::RELACIONES));
    }

    /**
     * Emitir es lo que convierte el borrador en una actuación: exige PIN (es la
     * firma del funcionario) y queda en el historial, como pide el documento de
     * requisitos para la descarga de un PDF legal.
     */
    public function emitir(Request $request, Documento $documento)
    {
        $this->exigirModificacion($request, $documento);

        $cambios = Auditoria::actualizar($documento, [
            'estado' => 'Emitido',
            'emitido_en' => now(),
        ]);

        Auditoria::registrar(
            $request,
            'Emisión de documento',
            'plantillas',
            "Documento '{$documento->titulo}' emitido" .
            ($documento->expediente ? " para el expediente {$documento->expediente->codigo}" : ''),
            $documento,
            $cambios,
        );

        return response()->json($documento->load(self::RELACIONES));
    }

    /**
     * Deja constancia de cada descarga o impresión, incluso de un documento ya
     * emitido: el requisito es registrar la salida del PDF, no sólo la primera.
     */
    public function registrarDescarga(Request $request, Documento $documento)
    {
        $request->validate(['medio' => 'nullable|in:pdf,impresion']);

        $medio = $request->input('medio', 'pdf') === 'impresion' ? 'Impresión' : 'Descarga PDF';

        Auditoria::registrar(
            $request,
            "{$medio} de documento",
            'plantillas',
            "{$medio} de '{$documento->titulo}'" .
            ($documento->expediente ? " del expediente {$documento->expediente->codigo}" : ''),
            $documento,
        );

        return response()->json(['message' => 'Registrado']);
    }

    public function destroy(Request $request, Documento $documento)
    {
        $this->rechazarSiEmitido($documento);

        abort_unless(
            Jurisdiccion::puedeDescartarDocumento($request->user(), $documento),
            403,
            'Sólo quien redactó el borrador o el administrador pueden descartarlo.',
        );

        $titulo = $documento->titulo;
        $cambios = Auditoria::eliminacion($documento);
        $documento->delete();

        Auditoria::registrar(
            $request,
            'Descarte de borrador',
            'plantillas',
            "Borrador '{$titulo}' descartado",
            $documento,
            $cambios,
        );

        return response()->json(['message' => 'Borrador descartado']);
    }

    private function validar(Request $request): array
    {
        return $request->validate([
            'expediente_id' => 'nullable|exists:expedientes,id',
            'plantilla' => 'required|string|max:60',
            'titulo' => 'required|string|max:255',
            'datos' => 'present|array',
        ]);
    }

    private function exigirModificacion(Request $request, Documento $documento): void
    {
        abort_unless(
            Jurisdiccion::puedeModificarDocumento($request->user(), $documento),
            403,
            'Sólo quien redactó el documento o el consejero asignado al expediente pueden modificarlo.',
        );
    }

    private function rechazarSiEmitido(Documento $documento): void
    {
        abort_if(
            $documento->estado === 'Emitido',
            422,
            'El documento ya fue emitido y no puede modificarse ni retirarse.',
        );
    }
}
