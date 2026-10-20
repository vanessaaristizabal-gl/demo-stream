<?php

namespace App\Domain\Governance\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value', 'changed_by'])]
class SystemFlag extends Model
{
    public const EMERGENCY_STOP = 'emergency_stop';

    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['value' => 'boolean'];
    }

    public static function isOn(string $key): bool
    {
        return (bool) static::query()->whereKey($key)->value('value');
    }

    public static function set(string $key, bool $value, ?int $userId = null): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value, 'changed_by' => $userId]);
    }
}
