<?php

namespace App\Domain\Playbooks\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property array<string, mixed> $template
 */
#[Fillable(['name', 'template'])]
class Playbook extends Model
{
    protected function casts(): array
    {
        return ['template' => 'array'];
    }
}
