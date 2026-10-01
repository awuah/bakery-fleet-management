import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';
import '../services/location_service.dart';
import 'delivery_screen.dart';
import 'inventory_screen.dart';
import 'select_van_screen.dart';

class HomeScreen extends StatefulWidget {
  final Vehicle vehicle;

  const HomeScreen({super.key, required this.vehicle});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final LocationService _locationService = LocationService();
  List<Customer> _customers = [];
  List<VehicleStock> _vehicleStock = [];
  bool _isLoading = true;
  bool _isGpsActive = false;
  String _lastGpsPingTime = 'Not started';
  String _currentGpsCoordinates = '';
  String? _gpsStatusMessage;

  @override
  void initState() {
    super.initState();
    _fetchData();
    _autoStartTracking();
  }

  Future<void> _autoStartTracking() async {
    // Automatically start live GPS broadcasting for the driver
    setState(() => _isGpsActive = true);
    await _locationService.startLiveTracking(
      vehicleId: widget.vehicle.id,
      simulate: false,
      onLocationPushed: (lat, lng) {
        if (mounted) {
          setState(() {
            _lastGpsPingTime =
                '${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}:${DateTime.now().second.toString().padLeft(2, '0')}';
            _currentGpsCoordinates = '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
            _gpsStatusMessage = null;
          });
        }
      },
      onError: (err) {
        if (mounted) {
          setState(() {
            _isGpsActive = false;
            _gpsStatusMessage = err;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(err),
              backgroundColor: Colors.redAccent,
              duration: const Duration(seconds: 5),
              action: SnackBarAction(
                label: 'Retry',
                textColor: Colors.white,
                onPressed: _toggleGpsTracking,
              ),
            ),
          );
        }
      },
    );
  }

  @override
  void dispose() {
    _locationService.stopLiveTracking();
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      final custResponse = await Supabase.instance.client
          .from('bk_customers')
          .select()
          .order('name');

      final stockResponse = await Supabase.instance.client
          .from('bk_vehicle_stock')
          .select('*, product:bk_products(*)')
          .eq('vehicle_id', widget.vehicle.id);

      setState(() {
        _customers = (custResponse as List)
            .map((json) => Customer.fromJson(json))
            .toList();
        _vehicleStock = (stockResponse as List)
            .map((json) => VehicleStock.fromJson(json))
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleGpsTracking() async {
    if (_isGpsActive) {
      _locationService.stopLiveTracking();
      setState(() => _isGpsActive = false);
    } else {
      setState(() => _isGpsActive = true);
      await _locationService.startLiveTracking(
        vehicleId: widget.vehicle.id,
        simulate: false,
        onLocationPushed: (lat, lng) {
          if (mounted) {
            setState(() {
              _lastGpsPingTime =
                  '${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}:${DateTime.now().second.toString().padLeft(2, '0')}';
              _currentGpsCoordinates = '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
              _gpsStatusMessage = null;
            });
          }
        },
        onError: (err) {
          if (mounted) {
            setState(() {
              _isGpsActive = false;
              _gpsStatusMessage = err;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(err),
                backgroundColor: Colors.redAccent,
              ),
            );
          }
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalRemaining =
        _vehicleStock.fold(0, (sum, s) => sum + s.currentQuantity);
    final totalDelivered =
        _vehicleStock.fold(0, (sum, s) => sum + s.deliveredQuantity);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                widget.vehicle.vanCode,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.vehicle.driverName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.swap_horiz, color: Colors.white70),
            tooltip: 'Switch Vehicle',
            onPressed: () {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const SelectVanScreen()),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFFF59E0B),
          backgroundColor: const Color(0xFF1E293B),
          onRefresh: _fetchData,
          child: _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: Color(0xFFF59E0B)),
                )
              : SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // GPS Live Broadcast Status Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _isGpsActive
                                ? const Color(0xFF10B981).withOpacity(0.5)
                                : Colors.grey.withOpacity(0.2),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: _isGpsActive
                                    ? const Color(0xFF10B981).withOpacity(0.2)
                                    : Colors.grey.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                _isGpsActive
                                    ? Icons.satellite_alt
                                    : Icons.location_off,
                                color: _isGpsActive
                                    ? const Color(0xFF34D399)
                                    : Colors.grey,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        _isGpsActive
                                            ? 'GPS Radar Broadcasting'
                                            : 'GPS Broadcast Paused',
                                        style: TextStyle(
                                          color: _isGpsActive
                                              ? const Color(0xFF34D399)
                                              : Colors.grey[400],
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _isGpsActive
                                        ? (_currentGpsCoordinates.isNotEmpty
                                            ? 'GPS: $_currentGpsCoordinates • Sync: $_lastGpsPingTime'
                                            : 'Acquiring GPS fix... • Sync: $_lastGpsPingTime')
                                        : (_gpsStatusMessage ?? 'Tap toggle to stream route to HQ map'),
                                    style: TextStyle(
                                      color: _isGpsActive
                                          ? const Color(0xFF6EE7B7)
                                          : (_gpsStatusMessage != null ? Colors.redAccent : Colors.grey[400]),
                                      fontSize: 11,
                                      fontFamily: _currentGpsCoordinates.isNotEmpty ? 'monospace' : null,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch(
                              value: _isGpsActive,
                              activeColor: const Color(0xFF10B981),
                              onChanged: (_) => _toggleGpsTracking(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // On-Board Stock Card
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: Colors.amber.withOpacity(0.3),
                          ),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Current Van Inventory',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                                TextButton.icon(
                                  style: TextButton.styleFrom(
                                    padding: EdgeInsets.zero,
                                    foregroundColor: const Color(0xFFF59E0B),
                                  ),
                                  onPressed: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => InventoryScreen(
                                          vehicle: widget.vehicle,
                                        ),
                                      ),
                                    );
                                  },
                                  icon: const Icon(Icons.inventory_2, size: 16),
                                  label: const Text(
                                    'Manifest',
                                    style: TextStyle(fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0F172A),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'On-Board Now',
                                          style: TextStyle(
                                            color: Colors.grey[400],
                                            fontSize: 11,
                                          ),
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
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0F172A),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Delivered Today',
                                          style: TextStyle(
                                            color: Colors.grey[400],
                                            fontSize: 11,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '$totalDelivered pcs',
                                          style: const TextStyle(
                                            color: Color(0xFF10B981),
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Delivery Route Stops
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Delivery Stops (Shops)',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${_customers.length} destinations',
                            style: TextStyle(
                              color: Colors.grey[400],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _customers.length,
                        itemBuilder: (context, index) {
                          final cust = _customers[index];
                          return Card(
                            color: const Color(0xFF1E293B),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(
                                color: Colors.grey.withOpacity(0.15),
                              ),
                            ),
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 38,
                                        height: 38,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0284C7)
                                              .withOpacity(0.2),
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: const Icon(
                                          Icons.storefront,
                                          color: Color(0xFF38BDF8),
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              cust.name,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 15,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              cust.address,
                                              style: TextStyle(
                                                color: Colors.grey[400],
                                                fontSize: 12,
                                              ),
                                            ),
                                            if (cust.contactPerson != null)
                                              Padding(
                                                padding:
                                                    const EdgeInsets.only(top: 4.0),
                                                child: Text(
                                                  'Contact: ${cust.contactPerson}',
                                                  style: TextStyle(
                                                    color: Colors.grey[500],
                                                    fontSize: 11,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFF59E0B),
                                        foregroundColor:
                                            const Color(0xFF0F172A),
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 11),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                      ),
                                      onPressed: () async {
                                        final result = await Navigator.of(context)
                                            .push<bool>(
                                          MaterialPageRoute(
                                            builder: (_) => DeliveryScreen(
                                              vehicle: widget.vehicle,
                                              customer: cust,
                                              vehicleStock: _vehicleStock,
                                            ),
                                          ),
                                        );

                                        if (result == true) {
                                          _fetchData();
                                        }
                                      },
                                      icon: const Icon(Icons.local_shipping,
                                          size: 17),
                                      label: const Text(
                                        'Deliver to this Shop',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}
