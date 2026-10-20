<?php

namespace App\Domain\Compliance\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['campaign_id', 'rulebook_id', 'rule_id', 'field', 'message', 'detected_at', 'resolved_at'])]
class ComplianceFinding extends Model
{
    protected function casts(): array
    {
        return ['detected_at' => 'datetime', 'resolved_at' => 'datetime'];
    }
}
