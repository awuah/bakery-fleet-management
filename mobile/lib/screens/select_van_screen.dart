import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';
import 'home_screen.dart';

class SelectVanScreen extends StatefulWidget {
  const SelectVanScreen({super.key});

  @override
  State<SelectVanScreen> createState() => _SelectVanScreenState();
}

class _SelectVanScreenState extends State<SelectVanScreen> {
  List<Vehicle> _vehicles = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchVehicles();
  }

  Future<void> _fetchVehicles() async {
    try {
      final response = await Supabase.instance.client
          .from('vehicles')
          .select()
          .order('van_code');
      setState(() {
        _vehicles = (response as List)
            .map((json) => Vehicle.fromJson(json))
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading fleet vehicles: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo & App Name
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.bakery_dining,
                      color: Color(0xFF0F172A),
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'CRUST & FLEET',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Text(
                        'Driver Companion Terminal',
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 36),

              const Text(
                'Select Your Vehicle',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Choose the delivery van assigned to your route shift today.',
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),

              // Vehicles list
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: Color(0xFFF59E0B)),
                      )
                    : ListView.builder(
                        itemCount: _vehicles.length,
                        itemBuilder: (context, index) {
                          final v = _vehicles[index];
                          return Card(
                            color: const Color(0xFF1E293B),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(
                                color: Colors.grey.withOpacity(0.2),
                              ),
                            ),
                            margin: const EdgeInsets.only(bottom: 14),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () {
                                Navigator.of(context).pushReplacement(
                                  MaterialPageRoute(
                                    builder: (_) => HomeScreen(vehicle: v),
                                  ),
                                );
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(18.0),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0F172A),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: Colors.amber.withOpacity(0.3),
                                        ),
                                      ),
                                      child: const Icon(
                                        Icons.local_shipping,
                                        color: Color(0xFFF59E0B),
                                        size: 22,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                v.vanCode,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                  horizontal: 8,
                                                  vertical: 2,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: Colors.amber.withOpacity(0.15),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  v.licensePlate,
                                                  style: const TextStyle(
                                                    color: Color(0xFFF59E0B),
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Driver: ${v.driverName}',
                                            style: TextStyle(
                                              color: Colors.grey[400],
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Icon(
                                      Icons.chevron_right,
                                      color: Colors.white54,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
