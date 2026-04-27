<?php

namespace App\Support;

class OrderStatus
{
    public const PENDING = 'ORDER_TAKEN';
    public const PREPARING = 'IN_KITCHEN';
    public const READY = 'READY';
    public const SERVED = 'SERVED';
    public const CANCELLED = 'CANCELLED';

    public static function all(): array
    {
        return [
            self::PENDING,
            self::PREPARING,
            self::READY,
            self::SERVED,
            self::CANCELLED,
        ];
    }

    public static function customerFlow(): array
    {
        return [self::PENDING, self::PREPARING, self::READY, self::SERVED];
    }

    public static function kitchenFlow(): array
    {
        return [self::PENDING, self::PREPARING, self::READY];
    }

    public static function normalize(string $status): string
    {
        return match (strtoupper($status)) {
            'PENDING', self::PENDING => self::PENDING,
            'PREPARING', self::PREPARING => self::PREPARING,
            'READY', self::READY => self::READY,
            'SERVED', self::SERVED => self::SERVED,
            'CANCELLED', self::CANCELLED => self::CANCELLED,
            default => $status,
        };
    }

    public static function publicLabel(string $status): string
    {
        return match (self::normalize($status)) {
            self::PENDING => 'PENDING',
            self::PREPARING => 'PREPARING',
            self::READY => 'READY',
            self::SERVED => 'SERVED',
            self::CANCELLED => 'CANCELLED',
            default => strtoupper($status),
        };
    }

    public static function allowedTransitionsForRole(string $role): array
    {
        return match (strtoupper($role)) {
            'KITCHEN' => [
                self::PENDING => [self::PREPARING],
                self::PREPARING => [self::READY],
            ],
            'WAITER' => [
                self::READY => [self::SERVED],
            ],
            'ADMIN' => [
                self::PENDING => [self::PREPARING],
                self::PREPARING => [self::READY],
                self::READY => [self::PREPARING, self::SERVED],
                self::SERVED => [self::READY],
            ],
            default => [],
        };
    }

    public static function canTransition(string $from, string $to, string $role): bool
    {
        $normalizedFrom = self::normalize($from);
        $normalizedTo = self::normalize($to);

        return in_array(
            $normalizedTo,
            self::allowedTransitionsForRole($role)[$normalizedFrom] ?? [],
            true
        );
    }

    public static function transitionTargets(string $from, string $role): array
    {
        return self::allowedTransitionsForRole($role)[self::normalize($from)] ?? [];
    }
}
