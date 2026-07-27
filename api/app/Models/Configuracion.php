<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    protected $table = 'configuraciones';
    
    protected $fillable = [
        'clave',
        'valor',
        'tipo',
        'categoria',
        'descripcion',
    ];

    public static function obtener($clave, $default = null)
    {
        $config = self::where('clave', $clave)->first();
        return $config ? $config->valor : $default;
    }

    public static function establecer($clave, $valor, $tipo = 'texto', $categoria = 'general', $descripcion = null)
    {
        return self::updateOrCreate(
            ['clave' => $clave],
            [
                'valor' => $valor,
                'tipo' => $tipo,
                'categoria' => $categoria,
                'descripcion' => $descripcion,
            ]
        );
    }

    public static function obtenerTodas($categoria = null)
    {
        $query = self::query();
        if ($categoria) {
            $query->where('categoria', $categoria);
        }
        return $query->get()->pluck('valor', 'clave')->toArray();
    }
}
