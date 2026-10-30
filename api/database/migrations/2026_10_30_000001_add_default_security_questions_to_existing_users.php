<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $usuariosConPreguntas = DB::table('preguntas_seguridad')
            ->select('user_id')
            ->distinct()
            ->pluck('user_id');

        $usuariosSinPreguntas = DB::table('users')
            ->whereNotIn('id', $usuariosConPreguntas)
            ->get();

        foreach ($usuariosSinPreguntas as $usuario) {
            DB::table('preguntas_seguridad')->insert([
                [
                    'user_id' => $usuario->id,
                    'pregunta' => '¿Cuál es tu color favorito?',
                    'respuesta' => Hash::make(Str::lower(trim('verde'))),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => $usuario->id,
                    'pregunta' => '¿Cuál es tu película favorita?',
                    'respuesta' => Hash::make(Str::lower(trim('titanic'))),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'preguntas_configuradas')) {
                DB::table('users')
                    ->where('id', $usuario->id)
                    ->update(['preguntas_configuradas' => true]);
            }
        }
    }

    public function down(): void
    {
        $usuariosAfectados = DB::table('preguntas_seguridad')
            ->where('pregunta', '¿Cuál es tu color favorito?')
            ->orWhere('pregunta', '¿Cuál es tu película favorita?')
            ->pluck('user_id')
            ->unique();

        DB::table('preguntas_seguridad')
            ->whereIn('user_id', $usuariosAfectados)
            ->whereIn('pregunta', [
                '¿Cuál es tu color favorito?',
                '¿Cuál es tu película favorita?',
            ])
            ->delete();

        DB::table('users')
            ->whereIn('id', $usuariosAfectados)
            ->update(['preguntas_configuradas' => false]);
    }
};
