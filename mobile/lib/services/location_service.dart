import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  Timer? _trackingTimer;
  bool _isTracking = false;
  bool get isTracking => _isTracking;

  // Waypoints for test driving simulation around delivery route
  final List<List<double>> _simulationWaypoints = [
    [51.5134, -0.1180],
    [51.5142, -0.1210],
    [51.5120, -0.1230], // Sunrise Cafe
    [51.5152, -0.1270],
    [51.5165, -0.1195], // Corner Baker
    [51.5180, -0.1240],
    [51.5205, -0.1320], // Soho Square
    [51.5218, -0.1342], // FreshMart Central
    [51.5170, -0.1250],
    [51.5060, -0.0950], // Harbor View
  ];
  int _waypointIndex = 0;

  Future<bool> checkPermissions() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  void startLiveTracking({
    required String vehicleId,
    bool simulate = true,
    Function(double lat, double lng)? onLocationPushed,
  }) {
    if (_isTracking) return;
    _isTracking = true;

    // Push initial location immediately
    _pushUpdate(vehicleId, simulate, onLocationPushed);

    // Stream every 5 seconds
    _trackingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _pushUpdate(vehicleId, simulate, onLocationPushed);
    });
  }

  void stopLiveTracking() {
    _trackingTimer?.cancel();
    _trackingTimer = null;
    _isTracking = false;
  }

  Future<void> _pushUpdate(
    String vehicleId,
    bool simulate,
    Function(double lat, double lng)? onLocationPushed,
  ) async {
    double lat = 51.5134;
    double lng = -0.1180;
    double speed = 28.5;

    if (simulate) {
      // Cycle through delivery waypoints
      final wp = _simulationWaypoints[_waypointIndex % _simulationWaypoints.length];
      lat = wp[0] + (0.0002 * (_waypointIndex % 3));
      lng = wp[1] + (0.0002 * (_waypointIndex % 2));
      speed = 24.0 + (_waypointIndex % 15);
      _waypointIndex++;
    } else {
      try {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 4),
          ),
        );
        lat = position.latitude;
        lng = position.longitude;
        speed = position.speed * 3.6; // m/s to km/h
      } catch (e) {
        debugPrint('Device GPS fetch fallback to simulated: $e');
      }
    }

    try {
      final supabase = Supabase.instance.client;
      await supabase.from('vehicles').update({
        'current_lat': lat,
        'current_lng': lng,
        'speed_kmh': speed,
        'status': 'on_route',
        'last_location_update': DateTime.now().toIso8601String(),
      }).eq('id', vehicleId);

      if (onLocationPushed != null) {
        onLocationPushed(lat, lng);
      }
    } catch (e) {
      debugPrint('Error broadcasting location to Supabase: $e');
    }
  }

  Future<void> sendSinglePing(String vehicleId, double lat, double lng) async {
    final supabase = Supabase.instance.client;
    await supabase.from('vehicles').update({
      'current_lat': lat,
      'current_lng': lng,
      'last_location_update': DateTime.now().toIso8601String(),
    }).eq('id', vehicleId);
  }
}
