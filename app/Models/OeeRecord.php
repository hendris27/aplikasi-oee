<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OeeRecord extends Model
{
    protected $table = 'oee_records';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'date',
        'line',
        'machine',
        'operator',
        'model',
        'customer',
        'start',
        'shift',
        'group',
        'oee',
        'avb',
        'pfm',
        'qly',
        'acv',
        'real_cycle',
        'std_cycle',
        'good',
        'ng',
        'run_time',
        'down_time',
        'setup_time',
        'stop_time',
        'downtime_logs',
        'ng_logs',
        'production_history',
        'source_index',
    ];

    protected function casts(): array
    {
        return [
            'downtime_logs' => 'array',
            'ng_logs' => 'array',
            'production_history' => 'array',
        ];
    }
}
