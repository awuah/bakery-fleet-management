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

  // Accra, Ghana delivery route waypoints
  final List<List<double>> _simulationWaypoints = [
    [5.6037, -0.1870], // HQ / Ridge Accra
    [5.5560, -0.1963], // Makola Market
    [5.5600, -0.1700], // Osu Oxford Street
    [5.5800, -0.1720], // Cantonments
    [5.6000, -0.1750], // Airport Residential
    [5.6200, -0.1600], // East Legon
    [5.6350, -0.1550], // American House
    [5.6500, -0.1800], // Madina
    [5.6400, -0.1900], // Legon University Campus
    [5.6100, -0.1950], // Dzorwulu
  ];
  int _waypointIndex = 0;

  Future<bool> checkPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('Location service disabled on device. Requesting settings.');
      await Geolocator.openLocationSettings();
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      debugPrint('Requesting location permission...');
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('Location permission denied by user.');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      debugPrint('Location permission permanently denied. Directing to app settings.');
      await Geolocator.openAppSettings();
      return false;
    }

    return true;
  }

  Future<void> startLiveTracking({
    required String vehicleId,
    bool simulate = false,
    Function(double lat, double lng)? onLocationPushed,
    Function(String error)? onError,
  }) async {
    if (_isTracking) return;
    _isTracking = true;

    if (!simulate) {
      final hasPermission = await checkPermissions();
      if (!hasPermission) {
        _isTracking = false;
        if (onError != null) {
          onError('Location permission denied or GPS service disabled on device.');
        }
        return;
      }
    }

    // Push initial location immediately
    await _pushUpdate(vehicleId, simulate, onLocationPushed);

    // Stream updates every 5 seconds
    _trackingTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      await _pushUpdate(vehicleId, simulate, onLocationPushed);
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
    double lat = 5.6037;
    double lng = -0.1870;
    double speed = 0.0;

    if (simulate) {
      // Cycle through delivery waypoints in Accra
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
            timeLimit: Duration(seconds: 6),
          ),
        );
        lat = position.latitude;
        lng = position.longitude;
        speed = position.speed >= 0 ? (position.speed * 3.6) : 0.0;
      } catch (e) {
        debugPrint('Error reading device GPS, attempting last known location: $e');
        try {
          final lastPos = await Geolocator.getLastKnownPosition();
          if (lastPos != null) {
            lat = lastPos.latitude;
            lng = lastPos.longitude;
            speed = lastPos.speed >= 0 ? (lastPos.speed * 3.6) : 0.0;
          }
        } catch (_) {}
      }
    }

    try {
      final supabase = Supabase.instance.client;
      await supabase.from('bk_vehicles').update({
        'current_lat': lat,
        'current_lng': lng,
        'speed_kmh': double.parse(speed.toStringAsFixed(1)),
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
    await supabase.from('bk_vehicles').update({
      'current_lat': lat,
      'current_lng': lng,
      'last_location_update': DateTime.now().toIso8601String(),
    }).eq('id', vehicleId);
  }
}
