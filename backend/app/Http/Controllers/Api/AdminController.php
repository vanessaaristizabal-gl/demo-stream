<?php

namespace App\Http\Controllers\Api;

use App\Domain\Compliance\ComplianceEngine;
use App\Domain\Compliance\Models\ComplianceFinding;
use App\Domain\Compliance\Models\Rulebook;
use App\Domain\Governance\Models\SystemFlag;
use App\Domain\Playbooks\Models\Playbook;
use App\Domain\Playbooks\PlaybookRenderer;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRulebookRequest;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

#[Group('Administration')]
class AdminController extends Controller
{
    /**
     * Is the emergency stop active?
     */
    public function emergencyStop(): JsonResponse
    {
        return response()->json(['active' => SystemFlag::isOn(SystemFlag::EMERGENCY_STOP)]);
    }

    /**
     * Engage or release the emergency stop (admin)
     *
     * While active, no change is accepted or written.
     */
    public function setEmergencyStop(Request $request): JsonResponse
    {
        $data = $request->validate(['active' => 'required|boolean']);
        SystemFlag::set(SystemFlag::EMERGENCY_STOP, $data['active'], $request->user()->id);

        return response()->json(['active' => $data['active']]);
    }

    /**
     * List manufacturer rulebooks
     */
    public function rulebooks(): JsonResponse
    {
        return response()->json(Rulebook::query()->orderBy('manufacturer')->orderByDesc('version')->get());
    }

    /**
     * Publish a new rulebook version (admin)
     *
     * Closes the previous version at the new effective date.
     */
    public function storeRulebook(StoreRulebookRequest $request): JsonResponse
    {
        $data = $request->validated();

        $version = (int) Rulebook::query()->where('manufacturer', $data['manufacturer'])->max('version') + 1;

        // The previous version stops applying the moment the new one takes effect.
        Rulebook::query()->where('manufacturer', $data['manufacturer'])->whereNull('effective_to')
            ->update(['effective_to' => $data['effective_from']]);

        return response()->json(Rulebook::create($data + ['version' => $version]), 201);
    }

    /**
     * List open compliance findings
     */
    public function findings(): JsonResponse
    {
        return response()->json(ComplianceFinding::query()->whereNull('resolved_at')->latest('detected_at')->paginate(50));
    }

    /**
     * Re-check every live campaign against current rulebooks (admin)
     */
    public function sweep(ComplianceEngine $engine): JsonResponse
    {
        return response()->json(['open_findings' => $engine->sweep()]);
    }

    /**
     * Render a playbook for a dealer context (admin)
     */
    public function renderPlaybook(Request $request, Playbook $playbook, PlaybookRenderer $renderer): JsonResponse
    {
        $context = $request->validate(['context' => 'required|array'])['context'];

        try {
            return response()->json(['config' => $renderer->render($playbook->template, $context)]);
        } catch (InvalidArgumentException $e) {
            return response()->json(['error' => 'render_failed', 'message' => $e->getMessage()], 422);
        }
    }
}
