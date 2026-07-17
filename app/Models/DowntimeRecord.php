<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DowntimeRecord extends Model
{
    protected $table = 'downtime_records';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'date',
        'line',
        'machine',
        'model',
        'type',
        'detail',
        'time',
        'period',
        'tech',
        'job',
        'executor',
        'solution',
    ];
}
