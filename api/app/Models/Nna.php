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
        // Sin formato, el cast 'date' serializa como ISO-8601 con hora y zona
        // (2012-03-14T00:00:00.000000Z). Es una fecha de nacimiento: no tiene
        // hora, y así <input type="date"> puede consumirla tal cual.
        'fecha_nacimiento' => 'date:Y-m-d',
    ];

    public function expedientes(): HasMany
    {
        return $this->hasMany(Expediente::class, 'nna_id');
    }
}
