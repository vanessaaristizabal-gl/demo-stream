<?php

namespace App\Http\Controllers\Api;

use App\Domain\Advertising\Models\AdAccount;
use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use App\Http\Resources\CampaignResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Accounts')]
class AccountController extends Controller
{
    /**
     * List ad accounts
     *
     * One row per dealer account on Google Ads or Meta, with its own monthly budget (integer cents) and how many campaigns it has.
     */
    public function index(): JsonResponse
    {
        return AccountResource::collection(AdAccount::query()->withCount('campaigns')->orderBy('dealer_name')->paginate(50))->response();
    }

    /**
     * Get one ad account
     *
     * The account with its campaigns. A campaign belongs to exactly one account.
     */
    public function show(AdAccount $adAccount): JsonResponse
    {
        $adAccount->loadCount('campaigns');

        return response()->json([
            'data' => [
                ...(new AccountResource($adAccount))->resolve(),
                'campaigns' => CampaignResource::collection($adAccount->campaigns()->orderBy('name')->get())->resolve(),
            ],
        ]);
    }
}
