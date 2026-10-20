<?php

namespace App\Domain\Advertising\Providers;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

trait RetriesRateLimits
{
    /** HTTP client that backs off and retries on 429 / 5xx; honours Retry-After. */
    protected function client(string $baseUrl): PendingRequest
    {
        return Http::baseUrl($baseUrl)
            ->acceptJson()
            ->timeout(30)
            ->retry(
                4,
                fn (int $attempt, \Throwable $e) => $this->backoffMs($attempt, $e),
                when: fn (\Throwable $e) => $e instanceof RequestException
                    && in_array($e->response->status(), [429, 500, 502, 503, 504], true),
                throw: true,
            );
    }

    private function backoffMs(int $attempt, \Throwable $e): int
    {
        $retryAfter = $e instanceof RequestException ? (int) $e->response->header('Retry-After') : 0;

        return $retryAfter > 0 ? $retryAfter * 1000 : (2 ** $attempt) * 500;
    }
}
