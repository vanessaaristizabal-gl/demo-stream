<?php

namespace App\Domain\Advertising\Models;

use App\Domain\Advertising\Enums\Provider;
use Database\Factories\AdAccountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property Provider $provider
 * @property string $external_id
 * @property string $dealer_name
 * @property string|null $manufacturer
 */
#[UseFactory(AdAccountFactory::class)]
#[Fillable(['provider', 'external_id', 'dealer_name', 'manufacturer'])]
class AdAccount extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['provider' => Provider::class];
    }

    /** @return HasMany<Campaign, $this> */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }
}
