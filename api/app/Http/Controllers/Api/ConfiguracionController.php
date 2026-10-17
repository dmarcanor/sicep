<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Configuracion;
use App\Support\Auditoria;
use App\Support\Institucion;
use Illuminate\Http\Request;

class ConfiguracionController extends Controller
{
    public function index(Request $request)
    {
        $categoria = $request->query('categoria');
        $query = Configuracion::query();
        
        if ($categoria) {
            $query->where('categoria', $categoria);
        }
        
        return response()->json($query->get());
    }

    public function show($clave)
    {
        $config = Configuracion::where('clave', $clave)->first();
        
        if (!$config) {
            return response()->json(['message' => 'Configuración no encontrada'], 404);
        }
        
        return response()->json($config);
    }

    public function update(Request $request, $clave)
    {
        $request->validate([
            'valor' => 'required',
        ]);

        $config = Configuracion::where('clave', $clave)->first();
        
        if (!$config) {
            return response()->json(['message' => 'Configuración no encontrada'], 404);
        }

        $cambios = Auditoria::actualizar($config, ['valor' => $request->valor]);

        Auditoria::registrar(
            $request,
            'Actualización de configuración',
            'configuracion',
            "Configuración '{$clave}' actualizada",
            $config,
            $cambios,
        );

        return response()->json($config);
    }

    public function updateMultiple(Request $request)
    {
        $request->validate([
            'configuraciones' => 'required|array',
            'configuraciones.*.clave' => 'required|string',
            'configuraciones.*.valor' => 'required',
        ]);

        $actualizadas = [];
        
        foreach ($request->configuraciones as $config) {
            $actualizada = Configuracion::where('clave', $config['clave'])->first();
            
            if ($actualizada) {
                $cambios = Auditoria::actualizar($actualizada, ['valor' => $config['valor']]);

                Auditoria::registrar(
                    $request,
                    'Actualización múltiple de configuración',
                    'configuracion',
                    "Configuración '{$actualizada->clave}' actualizada",
                    $actualizada,
                    $cambios,
                );

                $actualizadas[] = $actualizada;
            }
        }

        return response()->json($actualizadas);
    }

    /**
     * Ajustes de presentación para cualquier rol autenticado: sin ellos, quien
     * no administre el sistema no podría ni pintar el membrete de un documento.
     */
    public function institucion()
    {
        return response()->json(Institucion::valores());
    }

    public function obtenerPorCategoria($categoria)
    {
        $configs = Configuracion::where('categoria', $categoria)->get();
        return response()->json($configs);
    }
}
