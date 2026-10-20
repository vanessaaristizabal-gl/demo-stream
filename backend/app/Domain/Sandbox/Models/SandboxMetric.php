<?php

namespace App\Domain\Sandbox\Models;

use Database\Factories\SandboxMetricFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * One day of simulated performance. Money is integer cents.
 *
 * @property int $id
 * @property int $sandbox_campaign_id
 * @property Carbon $date
 * @property int $impressions
 * @property int $clicks
 * @property int $cost
 * @property string $conversions
 * @property int $conversions_value
 * @property int|null $reach
 */
#[UseFactory(SandboxMetricFactory::class)]
#[Fillable(['sandbox_campaign_id', 'date', 'impressions', 'clicks', 'cost', 'conversions', 'conversions_value', 'reach'])]
class SandboxMetric extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['date' => 'date'];
    }
}
