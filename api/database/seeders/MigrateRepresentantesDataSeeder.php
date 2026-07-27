<?php

namespace Database\Seeders;

use App\Models\Expediente;
use App\Models\Representante;
use Illuminate\Database\Seeder;

class MigrateRepresentantesDataSeeder extends Seeder
{
    public function run(): void
    {
        $expedientes = Expediente::whereNull('representante_id')
            ->whereNotNull('representante')
            ->get();

        $representantesCreados = [];

        foreach ($expedientes as $expediente) {
            $nombreRepresentante = $expediente->representante;
            
            if (!isset($representantesCreados[$nombreRepresentante])) {
                $partes = explode(' ', $nombreRepresentante);
                $nombres = $partes[0] ?? '';
                $apellidos = isset($partes[1]) ? implode(' ', array_slice($partes, 1)) : '';
                
                $representante = Representante::create([
                    'cedula' => 'PENDIENTE-' . uniqid(),
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                ]);
                
                $representantesCreados[$nombreRepresentante] = $representante->id;
            }
            
            $expediente->update(['representante_id' => $representantesCreados[$nombreRepresentante]]);
        }
    }
}
