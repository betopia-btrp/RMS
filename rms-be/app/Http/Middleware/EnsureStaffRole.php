<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $normalizedRoles = array_map(static fn (string $role) => strtoupper($role), $roles);

        if (! in_array(strtoupper($user->role), $normalizedRoles, true)) {
            abort(403, 'You do not have access to this area.');
        }

        return $next($request);
    }
}
