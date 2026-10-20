<?php

namespace App\Domain\Governance\WritePath;

use App\Domain\Governance\Models\Policy;

class PolicyMatcher
{
    /** First active policy that pre-approves every field in the diff, or null. */
    public function match(array $diff): ?Policy
    {
        return Policy::query()->where('active', true)->get()->first(fn (Policy $p) => $this->covers($p, $diff));
    }

    private function covers(Policy $policy, array $diff): bool
    {
        if (array_diff(array_keys($diff), $policy->allowed_fields) !== []) {
            return false;
        }

        if (isset($diff['daily_budget']) && $policy->max_budget_delta_pct !== null) {
            $old = $diff['daily_budget']['old'];
            if (! $old) {
                return false;
            }
            $deltaPct = abs($diff['daily_budget']['new'] - $old) / $old * 100;
            if ($deltaPct > $policy->max_budget_delta_pct) {
                return false;
            }
        }

        return true;
    }
}
