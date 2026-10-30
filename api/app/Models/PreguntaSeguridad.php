<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreguntaSeguridad extends Model
{
    use HasFactory;

    protected $table = 'preguntas_seguridad';

    protected $fillable = [
        'user_id',
        'pregunta',
        'respuesta',
    ];

    protected $hidden = [
        'respuesta',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
