<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalEmployee extends Model
{
    protected $connection = 'trn';

    protected $table = '_users';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'Employee_Status' => 'integer',
        ];
    }
}
