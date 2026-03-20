<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $tenant->name }} - Digital Menu</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #171A21;
            color: #E2E8F0;
        }
        .glass {
            background: rgba(31, 34, 41, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .primary-gradient {
            background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="pb-28">
    <!-- Header -->
    <header class="sticky top-0 z-50 glass border-b border-white/5 p-4">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-bold text-white">{{ strtoupper($tenant->name) }}</h1>
                <p class="text-xs text-orange-500 font-semibold tracking-wider flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    TABLE {{ $table->table_number }}
                </p>
            </div>
            <div class="flex gap-2">
                <button onclick="handleService('call-waiter')" class="w-10 h-10 rounded-xl glass flex items-center justify-center border-white/10 active:scale-90 transition-transform" title="Call Waiter">
                    <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
                <a href="/menu/{{ $tenant->slug }}/{{ $table->id }}/bill" class="w-10 h-10 rounded-xl glass flex items-center justify-center border-white/10 active:scale-90 transition-transform" title="Request Bill">
                    <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </a>
            </div>
        </div>
    </header>

    <!-- Categories Nav -->
    <div class="sticky top-[73px] z-40 bg-[#171A21]/80 backdrop-blur-sm">
        <div class="flex overflow-x-auto gap-3 p-4 no-scrollbar">
            @foreach($categories as $category)
                <a href="#cat-{{ $category->id }}" class="whitespace-nowrap px-4 py-2 rounded-full glass text-sm border-white/10 active:primary-gradient transition-all">
                    {{ $category->name }}
                </a>
            @endforeach
        </div>
    </div>

    <!-- Hero / Welcome -->
    <div class="px-4 py-6">
        <div class="primary-gradient p-6 rounded-3xl shadow-xl shadow-orange-500/10 relative overflow-hidden">
            @if($activeOrder)
                <div class="absolute top-0 right-0 bg-white/20 backdrop-blur-md px-4 py-1 rounded-bl-2xl text-[10px] font-black text-white uppercase tracking-widest border-l border-b border-white/10 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-success animate-ping"></span>
                    Joined Group
                </div>
            @endif
            <h2 class="text-2xl font-bold text-white leading-tight">Welcome to<br>{{ $tenant->name }}</h2>
            <p class="text-orange-100/80 text-sm mt-2">
                @if($activeOrder)
                    You've joined the active session for **Table {{ $table->table_number }}**. Your orders will be added to the shared bill.
                @else
                    Enjoy our curated selection of fine dining and signature dishes.
                @endif
            </p>
        </div>
    </div>

    <!-- Active Order History (If any) -->
    @if($activeOrder && $activeOrder->items->count() > 0)
    <div class="px-4 mt-6">
        <div class="glass p-5 rounded-3xl border-orange-500/20">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                    ACTIVE ORDER
                </h3>
                <div class="flex items-center gap-2">
                    <button onclick="window.location.reload()" class="p-1.5 glass rounded-lg hover:bg-white/10 transition-colors">
                        <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    @php
                        $statusColors = [
                            'Pending' => 'text-sky-400 bg-sky-400/10 border-sky-400/20',
                            'Preparing' => 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                            'Ready' => 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                            'Served' => 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
                            'Completed' => 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
                            'Cancelled' => 'text-rose-400 bg-rose-400/10 border-rose-400/20',
                        ];
                        $statusColorClass = $statusColors[$activeOrder->status] ?? 'text-success bg-success/10 border-success/20';
                    @endphp
                    <span class="text-[10px] font-bold {{ $statusColorClass }} px-3 py-1 rounded-full uppercase border">
                        {{ $activeOrder->status }}
                    </span>
                </div>
            </div>
            <div class="space-y-3">
                @foreach($activeOrder->items as $orderItem)
                <div class="flex justify-between items-center text-xs">
                    <div class="flex items-center gap-2">
                        <span class="w-5 h-5 glass rounded flex items-center justify-center font-bold text-orange-500">{{ $orderItem->quantity }}x</span>
                        <span class="text-zinc-300">{{ $orderItem->menuItem->name }}</span>
                    </div>
                    <span class="text-zinc-500 font-mono">Rs. {{ number_format($orderItem->unit_price * $orderItem->quantity) }}</span>
                </div>
                @endforeach
            </div>
            <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <span class="text-[10px] text-zinc-500 font-bold uppercase">Total Ordered</span>
                <span class="text-sm font-black text-white">Rs. {{ number_format($activeOrder->total) }}</span>
            </div>
        </div>
    </div>
    @endif

    <!-- Menu Items -->
    <main class="px-4 space-y-10">
        @foreach($categories as $category)
            <section id="cat-{{ $category->id }}" class="scroll-mt-32">
                <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                    <span class="w-1 h-6 primary-gradient rounded-full"></span>
                    {{ strtoupper($category->name) }}
                    <span class="text-xs font-normal text-zinc-500 ml-auto">{{ $category->menuItems->count() }} Items</span>
                </h2>
                <div class="grid gap-4">
                    @if($category->menuItems->count() > 0)
                        @foreach($category->menuItems as $item)
                            <div class="glass rounded-2xl overflow-hidden flex shadow-lg border border-white/5">
                                <div class="w-24 h-24 bg-zinc-800 flex-shrink-0">
                                    @if($item->image)
                                        <img src="{{ $item->image }}" class="w-full h-full object-cover">
                                    @else
                                        <div class="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-800/50">
                                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    @endif
                                </div>
                                <div class="p-3 flex-grow flex flex-col justify-between">
                                    <div>
                                        <div class="flex justify-between items-start">
                                            <h3 class="font-bold text-white text-sm">{{ $item->name }}</h3>
                                            @if($item->spicy_level > 0)
                                                <span class="text-[10px] text-red-500">🌶️</span>
                                            @endif
                                        </div>
                                        <p class="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">{{ $item->description }}</p>
                                    </div>
                                    <div class="flex items-center justify-between mt-2">
                                        <span class="text-orange-500 font-bold text-sm tracking-tight">Rs. {{ number_format($item->price) }}</span>
                                        <button 
                                            onclick="addToCart({{ json_encode(['id' => $item->id, 'name' => $item->name, 'price' => (float)$item->price]) }})"
                                            class="primary-gradient text-white p-1 rounded-xl text-[10px] font-bold px-4 h-8 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    @else
                        <p class="text-xs text-zinc-500 italic">No items available in this category.</p>
                    @endif
                </div>
            </section>
        @endforeach
    </main>

    <!-- Cart Footer Overlay -->
    <div id="cart-footer" class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass border border-white/10 p-4 rounded-[2rem] flex items-center justify-between shadow-2xl z-50 transition-all duration-300 translate-y-32">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 primary-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 relative">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div id="cart-count" class="absolute -top-1 -right-1 w-5 h-5 bg-white text-orange-600 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-orange-500 shadow-sm">0</div>
            </div>
            <div>
                <p class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Your Order</p>
                <p id="cart-total" class="text-sm font-black text-white">0 Items • Rs 0</p>
            </div>
        </div>
        <button onclick="toggleCheckout(true)" class="bg-white/5 px-6 py-3 rounded-2xl text-orange-500 font-black text-xs uppercase tracking-widest active:bg-white/10 transition-colors tracking-widest">Checkout</button>
    </div>

    <!-- Checkout Overlay -->
    <div id="checkout-overlay" class="fixed inset-0 z-[100] bg-[#171A21]/95 backdrop-blur-xl transition-all duration-500 translate-y-full flex flex-col">
        <header class="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-black text-white">Your Cart</h2>
                <p class="text-xs text-orange-500 font-bold uppercase tracking-widest">Review your selection</p>
            </div>
            <button onclick="toggleCheckout(false)" class="w-10 h-10 rounded-full glass flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </header>

        <div id="cart-items-list" class="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
            <!-- Items injected via JS -->
        </div>

        <footer class="p-6 glass border-t border-white/10 rounded-t-[3rem] space-y-4">
            <div class="space-y-2">
                <div class="flex justify-between text-xs text-zinc-400">
                    <span>Subtotal</span>
                    <span id="checkout-subtotal">Rs. 0</span>
                </div>
                <div class="flex justify-between text-xs text-zinc-400">
                    <span>Tax (13%)</span>
                    <span id="checkout-tax">Rs. 0</span>
                </div>
                <div class="flex justify-between text-lg font-black text-white pt-2 border-t border-white/5">
                    <span>Grand Total</span>
                    <span id="checkout-total" class="text-orange-500">Rs. 0</span>
                </div>
            </div>
            <button onclick="submitOrder()" id="place-order-btn" class="w-full primary-gradient py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-transform">
                Place Order
            </button>
        </footer>
    </div>

    <div id="toast" class="fixed top-24 left-1/2 -translate-x-1/2 z-[110] transform transition-all duration-300 opacity-0 translate-y-[-20px] pointer-events-none">
        <div class="glass px-6 py-3 rounded-2xl border-orange-500/50 flex items-center gap-3">
            <span id="toast-icon"></span>
            <p id="toast-message" class="text-sm font-bold text-white"></p>
        </div>
    </div>

    <script>
        const tenantSlug = '{{ $tenant->slug }}';
        const tableId = '{{ $table->id }}';
        let cart = [];

        function addToCart(item) {
            const existing = cart.find(i => i.id === item.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({ ...item, quantity: 1 });
            }
            updateCartUI();
            showToast(`${item.name} added!`, '🛒');
        }

        function updateQuantity(id, delta) {
            const item = cart.find(i => i.id === id);
            if (item) {
                item.quantity += delta;
                if (item.quantity <= 0) {
                    cart = cart.filter(i => i.id !== id);
                }
                updateCartUI();
                renderCartList();
            }
        }

        function removeFromCart(id) {
            cart = cart.filter(i => i.id !== id);
            updateCartUI();
            renderCartList();
        }

        function toggleCheckout(show) {
            const overlay = document.getElementById('checkout-overlay');
            if (show) {
                renderCartList();
                overlay.classList.remove('translate-y-full');
            } else {
                overlay.classList.add('translate-y-full');
            }
        }

        function renderCartList() {
            const list = document.getElementById('cart-items-list');
            if (cart.length === 0) {
                list.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-64 text-zinc-500">
                        <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p>Your cart is empty</p>
                        <button onclick="toggleCheckout(false)" class="mt-4 text-orange-500 font-bold uppercase text-xs">Go Back</button>
                    </div>
                `;
                toggleCheckout(false);
                return;
            }

            list.innerHTML = cart.map(item => `
                <div class="glass p-4 rounded-2xl flex items-center justify-between border-white/5 shadow-lg">
                    <div>
                        <h4 class="font-bold text-white text-sm">${item.name}</h4>
                        <p class="text-xs text-orange-500">Rs. ${item.price.toLocaleString()}</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center glass rounded-xl border-white/10 p-1">
                            <button onclick="updateQuantity(${item.id}, -1)" class="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">-</button>
                            <span class="w-8 text-center text-sm font-black text-white">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" class="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">+</button>
                        </div>
                        <button onclick="removeFromCart(${item.id})" class="text-zinc-600 hover:text-red-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');

            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.13;
            const total = subtotal + tax;

            document.getElementById('checkout-subtotal').innerText = `Rs. ${subtotal.toLocaleString()}`;
            document.getElementById('checkout-tax').innerText = `Rs. ${tax.toLocaleString()}`;
            document.getElementById('checkout-total').innerText = `Rs. ${total.toLocaleString()}`;
        }

        function updateCartUI() {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const footer = document.getElementById('cart-footer');
            const cartCount = document.getElementById('cart-count');
            const cartTotal = document.getElementById('cart-total');

            cartCount.innerText = totalItems;
            cartTotal.innerText = `${totalItems} Items • Rs. ${totalPrice.toLocaleString()}`;

            if (totalItems > 0) {
                footer.classList.remove('translate-y-32');
            } else {
                footer.classList.add('translate-y-32');
            }
        }

        async function submitOrder() {
            if (cart.length === 0) return;
            
            const btn = document.getElementById('place-order-btn');
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerText = 'Creating Order...';

            try {
                const response = await fetch(`/menu/${tenantSlug}/${tableId}/order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({ items: cart })
                });
                
                if (response.ok) {
                    showToast('Order received! 🍳', '✅');
                    cart = [];
                    updateCartUI();
                    toggleCheckout(false);
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 2500);
                } else {
                    throw new Error('Order failed');
                }
            } catch (error) {
                showToast('Failed to place order.', '❌');
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }

        async function handleService(action) {
            try {
                const response = await fetch(`/menu/${tenantSlug}/${tableId}/${action}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });
                const data = await response.json();
                showToast(data.message, action === 'call-waiter' ? '🔔' : '🧾');
            } catch (error) {
                showToast('Something went wrong.', '❌');
            }
        }

        function showToast(message, icon) {
            const toast = document.getElementById('toast');
            document.getElementById('toast-icon').innerText = icon;
            document.getElementById('toast-message').innerText = message;
            
            toast.classList.remove('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
            toast.classList.add('opacity-100', 'translate-y-0');
            
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
                toast.classList.remove('opacity-100', 'translate-y-0');
            }, 3000);
        }
    </script>
</body>
</html>
