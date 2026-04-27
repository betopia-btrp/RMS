<?php

namespace Database\Seeders;

use App\Models\Allergen;
use App\Models\Customer;
use App\Models\DietaryTag;
use App\Models\Ingredient;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\QrCode;
use App\Models\Receipt;
use App\Models\SalesReport;
use App\Models\StaffUser;
use App\Models\TableUnit;
use App\Models\Venue;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $venue = Venue::firstOrCreate(
            ['name' => 'Savoria Demo Restaurant'],
            [
                'subscription_tier' => 'growth',
                'currency' => 'USD',
                'timezone' => 'Asia/Dhaka',
                'welcome_banner' => 'QR-powered smart ordering for dine-in guests.',
                'service_charge_pct' => 5,
            ]
        );

        foreach ([
            ['Demo Admin', 'admin@savoria.local', 'ADMIN', 'admin123'],
            ['Kitchen Lead', 'kitchen@savoria.local', 'KITCHEN', 'kitchen123'],
            ['Floor Waitstaff', 'waiter@savoria.local', 'WAITER', 'waiter123'],
            ['Waitstaff One', 'waiter1@savoria.local', 'WAITER', 'waiter123'],
            ['Waitstaff Two', 'waiter2@savoria.local', 'WAITER', 'waiter123'],
            ['Waitstaff Three', 'waiter3@savoria.local', 'WAITER', 'waiter123'],
        ] as [$name, $email, $role, $pin]) {
            StaffUser::updateOrCreate(
                ['email' => $email],
                [
                    'venue_id' => $venue->venue_id,
                    'name' => $name,
                    'role' => $role,
                    'pin_hash' => Hash::make($pin),
                    'invited_at' => now(),
                ]
            );
        }

        foreach (['A1', 'A2', 'B1', 'Patio 1'] as $label) {
            $table = TableUnit::firstOrCreate(
                ['venue_id' => $venue->venue_id, 'label' => $label],
                ['section' => str_starts_with($label, 'Patio') ? 'Patio' : 'Dining']
            );

            QrCode::updateOrCreate(
                ['table_id' => $table->table_id],
                [
                    'venue_id' => $venue->venue_id,
                    'code_url' => "http://localhost:3000/menu?table={$table->table_id}",
                    'generated_at' => now(),
                ]
            );
        }

        $categories = collect([
            'Food' => 1,
            'Drinks' => 2,
            'Desserts' => 3,
        ])->map(fn ($sort, $name) => MenuCategory::updateOrCreate(
            ['venue_id' => $venue->venue_id, 'name' => $name],
            ['sort_order' => $sort]
        ));

        $tags = collect([
            'Vegetarian' => '#2F855A',
            'Vegan' => '#276749',
            'Halal' => '#2B6CB0',
            'Gluten-Free' => '#805AD5',
            'Spicy' => '#C53030',
            'Healthy' => '#319795',
            'High Protein' => '#975A16',
            'Fresh' => '#38A169',
            'Signature' => '#D69E2E',
            'Plant-Based' => '#2F855A',
            "Chef's Pick" => '#B7791F',
            'Seasonal' => '#718096',
            'Balanced' => '#3182CE',
            'Refreshing' => '#00A3C4',
            'Decadent' => '#97266D',
            'Creamy' => '#B83280',
        ])->map(fn ($color, $name) => DietaryTag::updateOrCreate(['name' => $name], ['color_code' => $color]));

        collect([
            ['Dairy', 'milk'],
            ['Gluten', 'wheat'],
            ['Tree Nuts', 'nut'],
            ['Sesame', 'seed'],
        ])->each(fn ($allergen) => Allergen::updateOrCreate(['name' => $allergen[0]], ['icon_code' => $allergen[1]]));

        $allergens = Allergen::query()->get()->keyBy('name');
        $ingredients = collect([
            'Chicken', 'Turmeric Rice', 'Citrus Slaw', 'Herb Yogurt', 'Roasted Peppers',
            'Flatbread', 'Basil Pesto', 'Heirloom Tomatoes', 'Ricotta', 'Arugula',
            'Mango Puree', 'Sparkling Water', 'Mint', 'Lime',
            'Dark Chocolate', 'Berry Compote', 'Tofu', 'Rice Noodles', 'Bok Choy',
            'Sesame Crunch', 'Chili Garlic Broth', 'Vanilla Cream Cheese', 'Almond Crust', 'Peach Slices',
        ])->mapWithKeys(fn ($name) => [$name => Ingredient::updateOrCreate(['name' => $name])]);

        $items = [
            ['Citrus Flame Chicken Bowl', 'Char-grilled chicken, turmeric rice, citrus slaw, herb yogurt, and roasted peppers.', 16.50, 'Food', 540, 38, 44, 88, ['Balanced', 'High Protein', 'Halal', 'Healthy', 'Spicy'], ['Chicken', 'Turmeric Rice', 'Citrus Slaw', 'Herb Yogurt', 'Roasted Peppers'], ['Dairy'], 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'],
            ['Garden Harvest Flatbread', 'Wood-fired flatbread with basil pesto, heirloom tomatoes, ricotta, and arugula.', 14.00, 'Food', 470, 18, 52, 82, ['Vegetarian', 'Fresh', 'Halal'], ['Flatbread', 'Basil Pesto', 'Heirloom Tomatoes', 'Ricotta', 'Arugula'], ['Dairy', 'Gluten'], 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80'],
            ['Velvet Mango Cooler', 'Fresh mango puree, sparkling water, mint, and lime over crushed ice.', 7.50, 'Drinks', 120, 1, 28, 76, ['Vegan', 'Vegetarian', 'Gluten-Free', 'Refreshing', 'Signature'], ['Mango Puree', 'Sparkling Water', 'Mint', 'Lime'], [], 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80'],
            ['Midnight Cocoa Tart', 'Dark chocolate ganache tart with sea salt flakes and berry compote.', 9.50, 'Desserts', 390, 6, 34, 59, ['Vegetarian', 'Decadent', "Chef's Pick"], ['Dark Chocolate', 'Berry Compote'], ['Dairy', 'Gluten'], 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80'],
            ['Ember Tofu Noodles', 'Rice noodles, glazed tofu, bok choy, sesame crunch, and chili-garlic broth.', 15.00, 'Food', 510, 21, 58, 84, ['Plant-Based', 'Spicy', 'Vegan', 'Vegetarian', 'Halal', 'Gluten-Free'], ['Tofu', 'Rice Noodles', 'Bok Choy', 'Sesame Crunch', 'Chili Garlic Broth'], ['Sesame'], 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=900&q=80'],
            ['Vanilla Cloud Cheesecake', 'Silky vanilla cheesecake with almond crust and caramelized peach slices.', 10.00, 'Desserts', 410, 7, 30, 63, ['Creamy', 'Seasonal', 'Vegetarian', 'Gluten-Free'], ['Vanilla Cream Cheese', 'Almond Crust', 'Peach Slices'], ['Dairy', 'Tree Nuts'], 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80'],
        ];

        $menuItems = collect();
        foreach ($items as $index => [$name, $description, $price, $category, $calories, $protein, $carbs, $score, $tagNames, $ingredientNames, $allergenNames, $image]) {
            $item = MenuItem::updateOrCreate(
                ['venue_id' => $venue->venue_id, 'name' => $name],
                [
                    'category_id' => $categories[$category]->category_id,
                    'description' => $description,
                    'price' => $price,
                    'calories' => $calories,
                    'protein_g' => $protein,
                    'carbs_g' => $carbs,
                    'health_score' => $score,
                    'sort_order' => $index + 1,
                ]
            );

            $item->photos()->updateOrCreate(
                ['item_id' => $item->item_id, 'sort_order' => 0],
                ['s3_url' => $image, 'uploaded_at' => now()]
            );
            $item->tags()->sync(collect($tagNames)->map(fn ($tag) => $tags[$tag]->tag_id)->all());
            $item->ingredients()->sync(collect($ingredientNames)->map(fn ($ingredient) => $ingredients[$ingredient]->ingredient_id)->all());
            $item->allergens()->sync(collect($allergenNames)->map(fn ($allergen) => $allergens[$allergen]->allergen_id)->all());
            $menuItems->put($name, $item);
        }

        $customers = collect([
            '+8801700000001',
            '+8801700000002',
            '+8801700000003',
        ])->map(fn ($phone) => Customer::create([
            'venue_id' => $venue->venue_id,
            'phone_number' => $phone,
            'created_at' => now(),
        ]));

        $tables = TableUnit::where('venue_id', $venue->venue_id)->get()->keyBy('label');
        $owner = StaffUser::where('venue_id', $venue->venue_id)->where('role', 'ADMIN')->first();
        $manager = StaffUser::where('venue_id', $venue->venue_id)->where('role', 'WAITER')->first();

        $orderDefinitions = [
            [
                'table' => 'A1',
                'customer' => 0,
                'status' => 'SERVED',
                'payment_method' => 'CARD',
                'payment_status' => 'PAID',
                'served' => true,
                'items' => [
                    ['Citrus Flame Chicken Bowl', 2, 'Less spicy'],
                    ['Velvet Mango Cooler', 2, null],
                ],
            ],
            [
                'table' => 'A2',
                'customer' => 1,
                'status' => 'READY',
                'payment_method' => 'CASH',
                'payment_status' => 'PAY_ON_TABLE',
                'served' => false,
                'items' => [
                    ['Garden Harvest Flatbread', 1, 'No ricotta'],
                    ['Vanilla Cloud Cheesecake', 1, null],
                ],
            ],
            [
                'table' => 'B1',
                'customer' => 2,
                'status' => 'IN_KITCHEN',
                'payment_method' => 'BKASH',
                'payment_status' => 'PAID',
                'served' => false,
                'items' => [
                    ['Ember Tofu Noodles', 1, 'Extra chili'],
                    ['Midnight Cocoa Tart', 1, null],
                ],
            ],
            [
                'table' => 'Patio 1',
                'customer' => 0,
                'status' => 'CANCELLED',
                'payment_method' => 'CASH',
                'payment_status' => 'PAY_ON_TABLE',
                'served' => false,
                'cancelled' => true,
                'items' => [
                    ['Velvet Mango Cooler', 1, null],
                ],
            ],
        ];

        foreach ($orderDefinitions as $definition) {
            $order = Order::create([
                'venue_id' => $venue->venue_id,
                'table_id' => $tables[$definition['table']]->table_id ?? null,
                'customer_id' => $customers[$definition['customer']]->customer_id ?? null,
                'status' => $definition['status'],
                'total_amount' => 0,
                'estimated_wait_min' => 18,
                'served_at' => ! empty($definition['served']) ? now() : null,
                'cancelled_at' => ! empty($definition['cancelled']) ? now() : null,
            ]);

            $orderTotal = 0;
            foreach ($definition['items'] as [$itemName, $quantity, $note]) {
                $menuItem = $menuItems[$itemName];
                $unitPrice = (float) $menuItem->price;
                $orderTotal += $unitPrice * $quantity;

                $order->items()->create([
                    'item_id' => $menuItem->item_id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'special_instruction' => $note,
                ]);
            }

            $orderTotalWithService = round($orderTotal + ($orderTotal * ((float) $venue->service_charge_pct / 100)), 2);
            $order->update(['total_amount' => $orderTotalWithService]);

            $payment = Payment::create([
                'order_id' => $order->order_id,
                'refund_initiated_by' => ! empty($definition['cancelled']) ? $manager?->user_id : null,
                'amount' => $orderTotalWithService,
                'currency' => $venue->currency,
                'status' => $definition['payment_status'],
                'method' => $definition['payment_method'],
                'paid_at' => $definition['payment_status'] === 'PAID' ? now() : null,
            ]);

            if ($definition['payment_status'] === 'PAID') {
                Receipt::create([
                    'payment_id' => $payment->payment_id,
                    'delivery_channel' => 'email',
                    'delivered_at' => now(),
                ]);
            }

            Notification::create([
                'venue_id' => $venue->venue_id,
                'order_id' => $order->order_id,
                'recipient_type' => 'kitchen',
                'delivery_method' => 'web',
                'content_snapshot' => "Order {$order->order_id} created for table {$definition['table']}",
                'sent_at' => now(),
                'acknowledged_at' => in_array($definition['status'], ['READY', 'SERVED'], true) ? now() : null,
            ]);
        }

        SalesReport::create([
            'venue_id' => $venue->venue_id,
            'generated_by' => $owner?->user_id,
            'period_type' => 'weekly',
            'date_from' => now()->subDays(7)->toDateString(),
            'date_to' => now()->toDateString(),
            'format' => 'json',
            'file_url' => 'http://localhost:8000/storage/reports/weekly-demo.json',
            'created_at' => now(),
        ]);
    }
}
