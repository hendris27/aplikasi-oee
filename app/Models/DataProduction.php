<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'line',
    'machine',
    'model',
    'target',
    'uph',
    'qty_pallet',
    'customer',
    'planned_time',
    'shift',
    'group',
])]
class DataProduction extends Model
{
    protected $table = 'data_production';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'target' => 'decimal:2',
            'uph' => 'decimal:2',
            'qty_pallet' => 'decimal:2',
            'planned_time' => 'integer',
        ];
    }
}
