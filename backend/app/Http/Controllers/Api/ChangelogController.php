<?php

namespace App\Http\Controllers\Api;

use App\Domain\Changelog\Enums\ChangeSource;
use App\Domain\Changelog\Models\ChangelogEntry;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChangelogEntryResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Changelog')]
class ChangelogController extends Controller
{
    /**
     * List recorded changes, including edits made directly in Google Ads or Meta
     */
    public function index(Request $request): JsonResponse
    {
        $query = ChangelogEntry::query()->with(['campaign:id,name', 'actor:id,name', 'approver:id,name'])->latest('occurred_at');

        if ($source = $request->query('source')) {
            $query->where('source', ChangeSource::from($source));
        }
        if ($campaign = $request->query('campaign_id')) {
            $query->where('campaign_id', $campaign);
        }

        if ($account = $request->query('account_id')) {
            $query->whereHas('campaign', fn ($campaigns) => $campaigns->where('ad_account_id', $account));
        }

        return ChangelogEntryResource::collection($query->paginate(50))->response();
    }
}
