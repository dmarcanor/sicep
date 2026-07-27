<?php

namespace Database\Seeders;

use App\Models\Expediente;
use App\Models\Nna;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MigrateNnaDataSeeder extends Seeder
{
    public function run(): void
    {
        $expedientes = Expediente::all();
        $nnaCreados = [];

        foreach ($expedientes as $expediente) {
            $key = $expediente->nino;
            
            if (!isset($nnaCreados[$key])) {
                $nna = Nna::create([
                    'documento_identidad' => 'DOC-' . str_pad($expediente->id, 6, '0', STR_PAD_LEFT),
                    'nombres' => explode(' ', $expediente->nino)[0] ?? $expediente->nino,
                    'apellidos' => explode(' ', $expediente->nino, 2)[1] ?? '',
                    'fecha_nacimiento' => '2010-01-01',
                    'sexo' => 'Femenino',
                ]);
                $nnaCreados[$key] = $nna->id;
            }

            $expediente->update(['nna_id' => $nnaCreados[$key]]);
        }
    }
}
