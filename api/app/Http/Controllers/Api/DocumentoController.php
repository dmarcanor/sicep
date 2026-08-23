<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Documento;
use App\Models\Historial;
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

        return response()->json($documento->load(self::RELACIONES), 201);
    }

    public function update(Request $request, Documento $documento)
    {
        $this->rechazarSiEmitido($documento);

        $documento->update($this->validar($request));

        return response()->json($documento->load(self::RELACIONES));
    }

    /**
     * Emitir es lo que convierte el borrador en una actuación: exige PIN (es la
     * firma del funcionario) y queda en el historial, como pide el documento de
     * requisitos para la descarga de un PDF legal.
     */
    public function emitir(Request $request, Documento $documento)
    {
        $documento->update([
            'estado' => 'Emitido',
            'emitido_en' => now(),
        ]);

        $this->registrar($request, $documento, 'Emisión de documento',
            "Documento '{$documento->titulo}' emitido" .
            ($documento->expediente ? " para el expediente {$documento->expediente->codigo}" : ''));

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

        $this->registrar($request, $documento, "{$medio} de documento",
            "{$medio} de '{$documento->titulo}'" .
            ($documento->expediente ? " del expediente {$documento->expediente->codigo}" : ''));

        return response()->json(['message' => 'Registrado']);
    }

    public function destroy(Request $request, Documento $documento)
    {
        $this->rechazarSiEmitido($documento);

        $titulo = $documento->titulo;
        $documento->delete();

        $this->registrar($request, $documento, 'Descarte de borrador',
            "Borrador '{$titulo}' descartado");

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

    private function rechazarSiEmitido(Documento $documento): void
    {
        abort_if(
            $documento->estado === 'Emitido',
            422,
            'El documento ya fue emitido y no puede modificarse ni retirarse.',
        );
    }

    private function registrar(Request $request, Documento $documento, string $accion, string $detalles): void
    {
        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => $accion,
            'modulo' => 'plantillas',
            'registro_tipo' => 'Documento',
            'registro_id' => $documento->id,
            'detalles' => $detalles,
            'ip_address' => $request->ip(),
        ]);
    }
}
