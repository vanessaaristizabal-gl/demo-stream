<?php

namespace App\Domain\Governance\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property list<string> $allowed_fields
 * @property float|null $max_budget_delta_pct
 */
#[Fillable(['name', 'allowed_fields', 'max_budget_delta_pct', 'active'])]
class Policy extends Model
{
    protected function casts(): array
    {
        return ['allowed_fields' => 'array', 'active' => 'boolean', 'max_budget_delta_pct' => 'float'];
    }
}
