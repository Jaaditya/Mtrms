<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bill Summary - {{ $tenant->name }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #0F1115;
            color: #E2E8F0;
        }
        .glass {
            background: rgba(31, 34, 41, 0.4);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        .receipt-card {
            position: relative;
            background: rgba(30, 32, 38, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .receipt-card::before, .receipt-card::after {
            content: '';
            position: absolute;
            left: 0;
            width: 100%;
            height: 10px;
            background-size: 20px 10px;
            z-index: 10;
        }
        .receipt-card::before {
            top: -5px;
            background-image: radial-gradient(circle at 10px -5px, transparent 12px, rgba(30, 32, 38, 1) 13px);
        }
        .receipt-card::after {
            bottom: -5px;
            background-image: radial-gradient(circle at 10px 15px, transparent 12px, rgba(30, 32, 38, 1) 13px);
        }
        .dashed-line {
            border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .primary-gradient {
            background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
        }
    </style>
</head>
<body class="min-h-screen p-4 flex flex-col items-center pb-12">
    <div class="w-full max-w-md">
        <!-- Header -->
        <header class="flex items-center justify-between mb-8 px-2">
            <a href="/menu/{{ $tenant->slug }}/{{ $table->id }}" class="w-10 h-10 rounded-2xl glass flex items-center justify-center text-zinc-400 active:scale-95 transition-transform">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                </svg>
            </a>
            <div class="text-right">
                <h1 class="text-xs font-black text-orange-500 tracking-[0.2em] uppercase">Digital Invoice</h1>
                <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">EST. {{ now()->format('Y') }}</p>
            </div>
        </header>

        <!-- Receipt Card -->
        <div class="receipt-card rounded-2xl p-8 mb-8">
            <!-- Brand Section -->
            <div class="text-center mb-8">
                <div class="w-12 h-12 primary-gradient rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <span class="text-xl font-black text-white italic">R</span>
                </div>
                <h2 class="text-2xl font-black text-white uppercase tracking-tight">{{ $tenant->name }}</h2>
                <div class="flex items-center justify-center gap-2 mt-2">
                    <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-2 py-0.5 glass rounded-full">Table #{{ $table->table_number }}</span>
                </div>
                <div class="mt-4 space-y-1">
                    <p class="text-[9px] text-zinc-500 font-medium uppercase tracking-tighter">Kathmandu, Nepal • +977 12345678</p>
                    <p class="text-[9px] text-zinc-500 font-mono italic">Order ID: #{{ $activeOrder ? 'TX-'.$activeOrder->id : 'N/A' }}</p>
                </div>
            </div>

            <div class="dashed-line my-6"></div>

            <!-- Items -->
            @if($activeOrder)
                <div class="space-y-6 mb-8">
                    @foreach($activeOrder->items as $item)
                        <div class="flex justify-between items-start">
                            <div class="flex-grow">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-black text-orange-500 font-mono">{{ sprintf('%02d', $item->quantity) }}x</span>
                                    <h4 class="text-[13px] font-bold text-white uppercase tracking-tight">{{ $item->menuItem->name }}</h4>
                                </div>
                                @if($item->instructions)
                                    <p class="text-[9px] text-zinc-500 italic ml-7 mt-0.5">* {{ $item->instructions }}</p>
                                @endif
                            </div>
                            <span class="text-[13px] font-black text-zinc-300 font-mono">Rs. {{ number_format($item->unit_price * $item->quantity) }}</span>
                        </div>
                    @endforeach
                </div>

                <div class="dashed-line my-6"></div>

                <!-- Totals -->
                <div class="space-y-3">
                    <div class="flex justify-between items-center px-1">
                        <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subtotal</span>
                        <span class="text-[11px] font-black text-zinc-400 font-mono">Rs. {{ number_format($activeOrder->subtotal) }}</span>
                    </div>
                    <div class="flex justify-between items-center px-1">
                        <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">VAT (13%)</span>
                        <span class="text-[11px] font-black text-zinc-400 font-mono">Rs. {{ number_format($activeOrder->tax) }}</span>
                    </div>
                    <div class="pt-4 flex justify-between items-center px-1 border-t border-white/5">
                        <span class="text-xs font-black text-white uppercase tracking-[0.2em]">Payable</span>
                        <span class="text-2xl font-black text-orange-500 font-mono tracking-tighter">Rs. {{ number_format($activeOrder->total) }}</span>
                    </div>
                </div>
                
                <div class="mt-8 text-center bg-white/5 p-3 rounded-xl border border-white/5">
                   <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Thank you for dining with us!</p>
                </div>
            @else
                <div class="text-center py-12">
                    <div class="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-600">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p class="text-[11px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">No transactions found<br>for this session.</p>
                </div>
            @endif
        </div>

        <!-- Action Buttons -->
        @if($activeOrder)
        <div class="fixed bottom-0 left-0 w-full p-6 glass border-t border-white/10 rounded-t-[2.5rem] flex flex-col gap-4 shadow-2xl z-50">
            <button onclick="requestBill()" id="bill-btn" class="w-full primary-gradient py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all text-xs outline-none">
                Confirm & Request Physical Bill
            </button>
            <p class="text-[9px] text-center text-zinc-500 font-medium px-4 leading-relaxed uppercase tracking-tighter">
                Our staff will present the formal tax invoice at your table upon confirmation.
            </p>
        </div>
        <div class="h-40"></div> <!-- Spacer -->
        @endif
    </div>

    <!-- Toast UI -->
    <div id="toast" class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] transform transition-all duration-500 opacity-0 translate-y-[-20px] pointer-events-none w-[90%] max-w-xs">
        <div class="glass px-6 py-4 rounded-2xl border-orange-500/50 flex items-center gap-4 shadow-2xl">
            <div id="toast-icon-wrapper" class="w-8 h-8 primary-gradient rounded-xl flex items-center justify-center text-white text-lg"></div>
            <p id="toast-message" class="text-[13px] font-black text-white uppercase tracking-tight"></p>
        </div>
    </div>

    <script>
        async function requestBill() {
            const btn = document.getElementById('bill-btn');
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </span>
            `;

            try {
                const response = await fetch('/menu/{{ $tenant->slug }}/{{ $table->id }}/request-bill', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });
                
                if (response.ok) {
                    showToast('Bill Requested!', '🧾');
                    btn.classList.remove('primary-gradient');
                    btn.classList.add('bg-zinc-800', 'text-orange-500', 'border', 'border-orange-500/30');
                    btn.innerText = 'BILL REQUESTED';
                    btn.disabled = true;
                } else {
                    throw new Error('Request failed');
                }
            } catch (error) {
                showToast('Network Error', '❌');
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }

        function showToast(message, icon) {
            const toast = document.getElementById('toast');
            const iconWrapper = document.getElementById('toast-icon-wrapper');
            const messageEl = document.getElementById('toast-message');
            
            iconWrapper.innerText = icon;
            messageEl.innerText = message;
            
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
