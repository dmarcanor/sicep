<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ExpedienteSeeder::class,
            MigrateNnaDataSeeder::class,
            ConfiguracionSeeder::class,
            RepresentanteSeeder::class,
            MigrateRepresentantesDataSeeder::class,
        ]);
    }
}
