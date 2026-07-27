<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Configuracion;
use App\Models\Historial;
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

        $config->update(['valor' => $request->valor]);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de configuración',
            'modulo' => 'configuracion',
            'registro_tipo' => 'Configuracion',
            'registro_id' => $config->id,
            'detalles' => "Configuración '{$clave}' actualizada",
            'ip_address' => $request->ip(),
        ]);

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
                $actualizada->update(['valor' => $config['valor']]);
                $actualizadas[] = $actualizada;
            }
        }

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización múltiple de configuración',
            'modulo' => 'configuracion',
            'registro_tipo' => 'Configuracion',
            'registro_id' => null,
            'detalles' => count($actualizadas) . ' configuraciones actualizadas',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($actualizadas);
    }

    public function obtenerPorCategoria($categoria)
    {
        $configs = Configuracion::where('categoria', $categoria)->get();
        return response()->json($configs);
    }
}
