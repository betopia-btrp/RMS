<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StaffLoginRequest;
use App\Http\Resources\AuthStaffResource;
use App\Models\StaffUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(StaffLoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $staff = StaffUser::where('email', $data['email'])->first();

        abort_if(! $staff || ! Hash::check($data['password'], $staff->pin_hash), 401, 'Invalid credentials.');

        $staff->update([
            'last_login_at' => now(),
            'failed_logins' => 0,
        ]);

        $token = $staff->createToken('staff-auth')->plainTextToken;

        return response()->json([
            'token' => $token,
            'staff' => new AuthStaffResource($staff),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['logged_out' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'staff' => new AuthStaffResource($request->user()),
        ]);
    }
}
