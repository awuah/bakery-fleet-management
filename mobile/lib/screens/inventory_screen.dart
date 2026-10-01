import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';

class InventoryScreen extends StatefulWidget {
  final Vehicle vehicle;

  const InventoryScreen({super.key, required this.vehicle});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  List<VehicleStock> _stockList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchVanStock();
    _subscribeToStockUpdates();
  }

  Future<void> _fetchVanStock() async {
    try {
      final response = await Supabase.instance.client
          .from('vehicle_stock')
          .select('*, product:products(*)')
          .eq('vehicle_id', widget.vehicle.id);

      setState(() {
        _stockList = (response as List)
            .map((json) => VehicleStock.fromJson(json))
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _subscribeToStockUpdates() {
    Supabase.instance.client
        .channel('van_stock_${widget.vehicle.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'vehicle_stock',
          callback: (payload) {
            _fetchVanStock();
          },
        )
        .subscribe();
  }

  @override
  Widget build(BuildContext context) {
    final totalRemaining = _stockList.fold(0, (sum, s) => sum + s.currentQuantity);
    final totalLoaded = _stockList.fold(0, (sum, s) => sum + s.loadedQuantity);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Van Manifest & Stock',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              '${widget.vehicle.vanCode} • ${widget.vehicle.driverName}',
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Summary
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.amber.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      const Text(
                        'Total Loaded',
                        style: TextStyle(color: Colors.white60, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$totalLoaded pcs',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Container(width: 1, height: 35, color: Colors.white24),
                  Column(
                    children: [
                      const Text(
                        'On-Board Now',
                        style: TextStyle(color: Color(0xFFF59E0B), fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$totalRemaining pcs',
                        style: const TextStyle(
                          color: Color(0xFFF59E0B),
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Stock Items
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: Color(0xFFF59E0B)),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _stockList.length,
                      itemBuilder: (context, index) {
                        final item = _stockList[index];
                        final prod = item.product;
                        final percent = item.loadedQuantity > 0
                            ? (item.currentQuantity / item.loadedQuantity)
                            : 0.0;

                        return Card(
                          color: const Color(0xFF1E293B),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                            side: BorderSide(color: Colors.grey.withOpacity(0.15)),
                          ),
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Padding(
                            padding: const EdgeInsets.all(14.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            prod?.name ?? 'Bakery Item',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'SKU: ${prod?.sku ?? "N/A"} • ${prod?.category ?? ""}',
                                            style: TextStyle(
                                              color: Colors.grey[400],
                                              fontSize: 11,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '${item.currentQuantity} remaining',
                                      style: const TextStyle(
                                        color: Color(0xFFF59E0B),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: percent.clamp(0.0, 1.0),
                                    backgroundColor: const Color(0xFF0F172A),
                                    valueColor: const AlwaysStoppedAnimation(Color(0xFFF59E0B)),
                                    minHeight: 6,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Loaded: ${item.loadedQuantity}',
                                      style: TextStyle(color: Colors.grey[400], fontSize: 11),
                                    ),
                                    Text(
                                      'Delivered: ${item.deliveredQuantity}',
                                      style: const TextStyle(
                                        color: Color(0xFF10B981),
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
