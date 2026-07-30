<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sector extends Model
{
    protected $fillable = ['sector_id', 'name', 'unit', 'status', 'metrics'];
    
    protected $casts = [
        'metrics' => 'array'
    ];
}
