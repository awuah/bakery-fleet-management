import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';

class DeliveryScreen extends StatefulWidget {
  final Vehicle vehicle;
  final Customer customer;
  final List<VehicleStock> vehicleStock;

  const DeliveryScreen({
    super.key,
    required this.vehicle,
    required this.customer,
    required this.vehicleStock,
  });

  @override
  State<DeliveryScreen> createState() => _DeliveryScreenState();
}

class _DeliveryScreenState extends State<DeliveryScreen> {
  final Map<String, int> _deliveryQuantities = {};
  final TextEditingController _recipientController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    // Default 0 for each stock item
    for (var stock in widget.vehicleStock) {
      _deliveryQuantities[stock.productId] = 0;
    }
  }

  @override
  void dispose() {
    _recipientController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  int get _totalDeliveredItems {
    return _deliveryQuantities.values.fold(0, (sum, q) => sum + q);
  }

  double get _totalDeliveredValue {
    double total = 0.0;
    for (var stock in widget.vehicleStock) {
      final qty = _deliveryQuantities[stock.productId] ?? 0;
      final price = stock.product?.unitPrice ?? 0.0;
      total += qty * price;
    }
    return total;
  }

  Future<void> _submitDelivery() async {
    if (_totalDeliveredItems == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one item to deliver.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final itemsPayload = widget.vehicleStock
          .where((s) => (_deliveryQuantities[s.productId] ?? 0) > 0)
          .map((s) => {
                'product_id': s.productId,
                'quantity': _deliveryQuantities[s.productId],
                'unit_price': s.product?.unitPrice ?? 0.0,
              })
          .toList();

      final response = await Supabase.instance.client.rpc(
        'record_van_delivery',
        params: {
          'p_vehicle_id': widget.vehicle.id,
          'p_customer_id': widget.customer.id,
          'p_items': itemsPayload,
          'p_recipient_name': _recipientController.text.trim().isEmpty
              ? 'Store Manager'
              : _recipientController.text.trim(),
          'p_notes': _notesController.text.trim().isEmpty
              ? 'Delivered via Companion App'
              : _notesController.text.trim(),
          'p_lat': widget.customer.lat,
          'p_lng': widget.customer.lng,
        },
      );

      final deliveryNumber = response['delivery_number'] ?? 'DEL-CONFIRMED';

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            backgroundColor: const Color(0xFF1E293B),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: Color(0xFF10B981), size: 28),
                SizedBox(width: 10),
                Text(
                  'Delivery Logged!',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Receipt: $deliveryNumber',
                  style: const TextStyle(
                    color: Color(0xFFF59E0B),
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Customer: ${widget.customer.name}',
                  style: const TextStyle(color: Colors.white70),
                ),
                Text(
                  'Items: $_totalDeliveredItems units',
                  style: const TextStyle(color: Colors.white70),
                ),
                Text(
                  'Total Value: GH₵${_totalDeliveredValue.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                  ),
                  child: const Text(
                    '⚡ Realtime sync: The bakery HQ web dashboard map and inventory have been updated immediately.',
                    style: TextStyle(color: Color(0xFF34D399), fontSize: 12),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop(); // pop dialog
                  Navigator.of(context).pop(true); // return with success
                },
                child: const Text(
                  'Done & Return',
                  style: TextStyle(
                    color: Color(0xFFF59E0B),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Delivery error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Record Shop Delivery',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              widget.customer.name,
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Customer Header Card
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.storefront, color: Color(0xFF38BDF8), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.customer.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.customer.address,
                          style: TextStyle(color: Colors.grey[400], fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Products list with counters
            Expanded(
              child: widget.vehicleStock.isEmpty
                  ? const Center(
                      child: Text(
                        'No stock loaded on this van.',
                        style: TextStyle(color: Colors.grey),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: widget.vehicleStock.length,
                      itemBuilder: (context, index) {
                        final stock = widget.vehicleStock[index];
                        final maxAvailable = stock.currentQuantity;
                        final currentCount = _deliveryQuantities[stock.productId] ?? 0;
                        final prod = stock.product;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: currentCount > 0
                                  ? const Color(0xFFF59E0B)
                                  : Colors.grey.withOpacity(0.15),
                            ),
                          ),
                          child: Row(
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
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Text(
                                          'GH₵${(prod?.unitPrice ?? 0).toStringAsFixed(2)} / unit',
                                          style: const TextStyle(
                                            color: Color(0xFF34D399),
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Text(
                                          'Van Stock: $maxAvailable',
                                          style: TextStyle(
                                            color: Colors.grey[400],
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),

                              // Stepper Controls
                              Row(
                                children: [
                                  IconButton(
                                    onPressed: currentCount > 0
                                        ? () {
                                            setState(() {
                                              _deliveryQuantities[stock.productId] =
                                                  currentCount - 1;
                                            });
                                          }
                                        : null,
                                    icon: const Icon(Icons.remove_circle_outline),
                                    color: Colors.amber,
                                    disabledColor: Colors.grey.shade700,
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0F172A),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      '$currentCount',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    onPressed: currentCount < maxAvailable
                                        ? () {
                                            setState(() {
                                              _deliveryQuantities[stock.productId] =
                                                  currentCount + 1;
                                            });
                                          }
                                        : null,
                                    icon: const Icon(Icons.add_circle_outline),
                                    color: Colors.amber,
                                    disabledColor: Colors.grey.shade700,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),

            // Additional details & confirmation footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                children: [
                  TextField(
                    controller: _recipientController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Recipient Name (e.g. Store Manager)',
                      hintStyle: TextStyle(color: Colors.grey[500], fontSize: 13),
                      filled: true,
                      fillColor: const Color(0xFF0F172A),
                      isDense: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                      prefixIcon: const Icon(Icons.person, color: Colors.grey, size: 18),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _notesController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Delivery Notes (Optional)',
                      hintStyle: TextStyle(color: Colors.grey[500], fontSize: 13),
                      filled: true,
                      fillColor: const Color(0xFF0F172A),
                      isDense: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                      prefixIcon: const Icon(Icons.notes, color: Colors.grey, size: 18),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Summary Row & Submit Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$_totalDeliveredItems items to drop',
                            style: TextStyle(color: Colors.grey[400], fontSize: 12),
                          ),
                          Text(
                            'GH₵${_totalDeliveredValue.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Color(0xFF10B981),
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF59E0B),
                          foregroundColor: const Color(0xFF0F172A),
                          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: _isSubmitting ? null : _submitDelivery,
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.check, size: 18),
                        label: Text(
                          _isSubmitting ? 'Syncing...' : 'Confirm Delivery',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
