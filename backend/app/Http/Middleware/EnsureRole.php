<?php

namespace App\Http\Middleware;

use App\Domain\Identity\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $allowed = array_map(fn (string $r) => UserRole::from($r), $roles);

        abort_unless($request->user()?->hasRole(...$allowed), 403, 'Insufficient role.');

        return $next($request);
    }
}
