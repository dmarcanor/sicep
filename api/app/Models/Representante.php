<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Representante extends Model
{
    protected $fillable = [
        'cedula',
        'nombres',
        'apellidos',
        'telefono',
        'direccion',
        'email',
        'profesion',
        'lugar_trabajo',
    ];

    public function expedientes(): HasMany
    {
        return $this->hasMany(Expediente::class);
    }

    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombres} {$this->apellidos}";
    }
}
