<?php

namespace App\Domain\Compliance;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Compliance\Models\ComplianceFinding;
use App\Domain\Compliance\Models\Rulebook;
use Illuminate\Support\Carbon;

/**
 * Evaluates a campaign state against the manufacturer rulebook in force at a given date.
 *
 * Rule shape: {id, field, operator: max|min|in|not_in|equals|required, value?, message?, applies_to?: [types]}
 */
class ComplianceEngine
{
    /** @return list<Violation> */
    public function evaluate(Campaign $campaign, array $state, ?Carbon $at = null): array
    {
        $manufacturer = $campaign->account->manufacturer;
        if ($manufacturer === null) {
            return [];
        }

        $rulebook = Rulebook::query()->where('manufacturer', $manufacturer)->effectiveAt($at ?? now())->first();
        if ($rulebook === null) {
            return [];
        }

        $violations = [];
        foreach ($rulebook->rules as $rule) {
            if (isset($rule['applies_to']) && ! in_array($campaign->type, $rule['applies_to'], true)) {
                continue;
            }
            if (! $this->passes($rule, $state[$rule['field']] ?? null)) {
                $violations[] = new Violation(
                    $rulebook->id,
                    $rule['id'],
                    $rule['field'],
                    $rule['message'] ?? "Rule {$rule['id']} violated on {$rule['field']}.",
                );
            }
        }

        return $violations;
    }

    /**
     * Re-check every live campaign, opening findings for new violations and
     * resolving the ones that no longer apply. Returns the number of open findings.
     */
    public function sweep(?Carbon $at = null): int
    {
        $open = 0;

        Campaign::query()->with('account')->chunkById(200, function ($campaigns) use ($at, &$open) {
            foreach ($campaigns as $campaign) {
                $violations = collect($this->evaluate($campaign, $campaign->live, $at))->keyBy('ruleId');

                $existing = ComplianceFinding::query()
                    ->where('campaign_id', $campaign->id)->whereNull('resolved_at')->get()->keyBy('rule_id');

                foreach ($existing as $ruleId => $finding) {
                    if (! $violations->has($ruleId)) {
                        $finding->update(['resolved_at' => now()]);
                    }
                }

                foreach ($violations as $ruleId => $v) {
                    if (! $existing->has($ruleId)) {
                        ComplianceFinding::create([
                            'campaign_id' => $campaign->id,
                            'rulebook_id' => $v->rulebookId,
                            'rule_id' => $ruleId,
                            'field' => $v->field,
                            'message' => $v->message,
                            'detected_at' => now(),
                        ]);
                    }
                    $open++;
                }
            }
        });

        return $open;
    }

    private function passes(array $rule, mixed $value): bool
    {
        if ($rule['operator'] === 'required') {
            return $value !== null && $value !== '';
        }
        if ($value === null) {
            return true; // nothing to check on an absent optional field
        }

        return match ($rule['operator']) {
            'max' => $value <= $rule['value'],
            'min' => $value >= $rule['value'],
            'in' => in_array($value, $rule['value'], true),
            'not_in' => ! in_array($value, $rule['value'], true),
            'equals' => $value === $rule['value'],
            default => throw new \InvalidArgumentException("Unknown operator [{$rule['operator']}]"),
        };
    }
}
