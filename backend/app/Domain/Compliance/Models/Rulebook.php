<?php

namespace App\Domain\Compliance\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $manufacturer
 * @property int $version
 * @property array<int, array<string, mixed>> $rules
 */
#[Fillable(['manufacturer', 'version', 'effective_from', 'effective_to', 'rules'])]
class Rulebook extends Model
{
    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_to' => 'date',
            'rules' => 'array',
        ];
    }

    /** Rulebooks in force at the given moment, newest version first. */
    public function scopeEffectiveAt(Builder $query, Carbon $at): void
    {
        $query->whereDate('effective_from', '<=', $at)
            ->where(fn (Builder $q) => $q->whereNull('effective_to')->orWhereDate('effective_to', '>', $at))
            ->orderByDesc('version');
    }
}
