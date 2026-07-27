<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Nna extends Model
{
    protected $table = 'nna';

    protected $fillable = [
        'documento_identidad',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'sexo',
        'lugar_nacimiento',
        'observaciones',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
    ];

    public function expedientes(): HasMany
    {
        return $this->hasMany(Expediente::class, 'nna_id');
    }
}
