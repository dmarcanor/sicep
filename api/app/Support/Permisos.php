<?php

namespace App\Support;

use App\Models\Configuracion;

class Permisos
{
    /**
     * Los módulos que el menú lateral puede mostrar. La matriz configurable de
     * Configuración → Permisos por rol se expresa en estos identificadores.
     */
    public const MODULOS = [
        'principal',
        'urd',
        'nna',
        'representantes',
        'expedientes',
        'solicitudArchivos',
        'asignacionCasos',
        'plantillas',
        'reportes',
        'historial',
        'usuarios',
        'configuracion',
    ];

    /**
     * El panel principal es la pantalla de aterrizaje tras iniciar sesión: se
     * concede siempre para que ninguna combinación de la matriz deje a un rol
     * sin ninguna pantalla a la que entrar.
     */
    public const MODULO_BASE = 'principal';

    /**
     * Techo por rol: lo máximo que la matriz puede llegar a conceder. Refleja
     * las rutas que el middleware `role` deja pasar, de modo que la matriz
     * nunca pueda ofrecer un módulo cuya API responderá 403.
     */
    public const TOPE_POR_ROL = [
        'administrador' => self::MODULOS,
        'supervisor' => [
            'principal', 'urd', 'nna', 'representantes', 'expedientes',
            'solicitudArchivos', 'asignacionCasos', 'plantillas', 'reportes', 'historial',
        ],
        'consejero' => [
            'principal', 'urd', 'nna', 'representantes', 'expedientes', 'solicitudArchivos',
        ],
    ];

    public const PREDETERMINADOS = [
        'administrador' => self::MODULOS,
        'supervisor' => [
            'principal', 'urd', 'nna', 'representantes', 'expedientes',
            'solicitudArchivos', 'asignacionCasos', 'reportes', 'historial',
        ],
        'consejero' => [
            'principal', 'urd', 'nna', 'representantes', 'expedientes', 'solicitudArchivos',
        ],
    ];

    public static function clave(string $rol): string
    {
        return "permisos_{$rol}";
    }

    /**
     * Módulos efectivos de un rol: lo guardado en configuración, recortado al
     * techo del rol. Si el valor guardado no es utilizable se cae a los
     * predeterminados, nunca a una lista vacía.
     */
    public static function delRol(?string $rol): array
    {
        $tope = self::TOPE_POR_ROL[$rol] ?? [];

        if ($tope === []) {
            return [];
        }

        $guardado = json_decode((string) Configuracion::obtener(self::clave($rol)), true);

        $lista = is_array($guardado)
            ? $guardado
            : (self::PREDETERMINADOS[$rol] ?? []);

        $lista = array_intersect($lista, $tope);
        $lista[] = self::MODULO_BASE;

        // Se reordena según MODULOS para que el menú salga siempre igual.
        return array_values(array_intersect(self::MODULOS, array_unique($lista)));
    }

    public static function permite(?string $rol, string $modulo): bool
    {
        return in_array($modulo, self::delRol($rol), true);
    }
}
