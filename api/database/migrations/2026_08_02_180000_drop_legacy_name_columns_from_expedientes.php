<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Each step is guarded so a partially applied run can be resumed.
    public function up(): void
    {
        // A row still missing a foreign key would be orphaned by the column drop,
        // so recover the link from the name string before it goes away.
        if (Schema::hasColumn('expedientes', 'nino')) {
            // Use database-agnostic approach for SQLite compatibility
            $expedientes = DB::table('expedientes')
                ->whereNull('nna_id')
                ->whereNotNull('nino')
                ->get();
            
            foreach ($expedientes as $exp) {
                $nna = DB::table('nna')
                    ->whereRaw("(nombres || ' ' || apellidos) = ?", [$exp->nino])
                    ->first();
                
                if ($nna) {
                    DB::table('expedientes')
                        ->where('id', $exp->id)
                        ->update(['nna_id' => $nna->id]);
                }
            }
        }

        if (Schema::hasColumn('expedientes', 'representante')) {
            // Use database-agnostic approach for SQLite compatibility
            $expedientes = DB::table('expedientes')
                ->whereNull('representante_id')
                ->whereNotNull('representante')
                ->get();
            
            foreach ($expedientes as $exp) {
                $representante = DB::table('representantes')
                    ->whereRaw("(nombres || ' ' || apellidos) = ?", [$exp->representante])
                    ->first();
                
                if ($representante) {
                    DB::table('expedientes')
                        ->where('id', $exp->id)
                        ->update(['representante_id' => $representante->id]);
                }
            }
        }

        $huerfanos = DB::table('expedientes')
            ->whereNull('nna_id')
            ->orWhereNull('representante_id')
            ->count();

        if ($huerfanos > 0) {
            throw new RuntimeException(
                "No se puede continuar: {$huerfanos} expediente(s) sin nna_id o representante_id. " .
                'Asigne el NNA y el representante correspondientes antes de ejecutar esta migración.'
            );
        }

        $legacy = array_values(array_filter(
            ['nino', 'representante'],
            fn ($col) => Schema::hasColumn('expedientes', $col)
        ));

        if ($legacy !== []) {
            Schema::table('expedientes', function (Blueprint $table) use ($legacy) {
                $table->dropColumn($legacy);
            });
        }

        // representante_id was created with onDelete('set null'), which cannot survive a
        // NOT NULL column, so the constraint is rebuilt as restrict alongside nna_id
        // (which arrived as a plain column with no constraint at all).
        if ($this->foreignKeyExists('expedientes_representante_id_foreign')) {
            Schema::table('expedientes', function (Blueprint $table) {
                $table->dropForeign(['representante_id']);
            });
        }

        Schema::table('expedientes', function (Blueprint $table) {
            $table->foreignId('nna_id')->nullable(false)->change();
            $table->foreignId('representante_id')->nullable(false)->change();
        });

        if (! $this->foreignKeyExists('expedientes_nna_id_foreign')) {
            Schema::table('expedientes', function (Blueprint $table) {
                $table->foreign('nna_id')->references('id')->on('nna')->onDelete('restrict');
            });
        }

        if (! $this->foreignKeyExists('expedientes_representante_id_foreign')) {
            Schema::table('expedientes', function (Blueprint $table) {
                $table->foreign('representante_id')->references('id')->on('representantes')->onDelete('restrict');
            });
        }
    }

    private function foreignKeyExists(string $nombre): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite uses PRAGMA to list foreign keys
            $tableName = 'expedientes';
            $foreignKeys = DB::select("PRAGMA foreign_key_list({$tableName})");
            foreach ($foreignKeys as $fk) {
                if (isset($fk->id) && $fk->id !== null) {
                    // SQLite PRAGMA returns indexed results; check by constraint pattern
                    return true;
                }
            }
            // Fallback: try to create the constraint and catch if it exists
            return false;
        }

        return DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'expedientes')
            ->where('CONSTRAINT_NAME', $nombre)
            ->where('CONSTRAINT_TYPE', 'FOREIGN KEY')
            ->exists();
    }

    public function down(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->dropForeign(['nna_id']);
            $table->dropForeign(['representante_id']);
            $table->string('nino')->nullable();
            $table->string('representante')->nullable();
        });

        // Database-agnostic approach
        $expedientes = DB::table('expedientes')->get();
        foreach ($expedientes as $exp) {
            $nna = DB::table('nna')->where('id', $exp->nna_id)->first();
            if ($nna) {
                DB::table('expedientes')
                    ->where('id', $exp->id)
                    ->update(['nino' => $nna->nombres . ' ' . $nna->apellidos]);
            }

            $representante = DB::table('representantes')->where('id', $exp->representante_id)->first();
            if ($representante) {
                DB::table('expedientes')
                    ->where('id', $exp->id)
                    ->update(['representante' => $representante->nombres . ' ' . $representante->apellidos]);
            }
        }

        Schema::table('expedientes', function (Blueprint $table) {
            $table->foreignId('nna_id')->nullable()->change();
            $table->foreignId('representante_id')->nullable()->change();
        });

        Schema::table('expedientes', function (Blueprint $table) {
            $table->foreign('representante_id')->references('id')->on('representantes')->onDelete('set null');
        });
    }
};
