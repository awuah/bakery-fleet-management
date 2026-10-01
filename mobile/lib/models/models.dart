class Vehicle {
  final String id;
  final String vanCode;
  final String driverName;
  final String driverPhone;
  final String driverPin;
  final String licensePlate;
  final String status;
  final double currentLat;
  final double currentLng;
  final double speedKmh;
  final int batteryLevel;

  Vehicle({
    required this.id,
    required this.vanCode,
    required this.driverName,
    required this.driverPhone,
    required this.driverPin,
    required this.licensePlate,
    required this.status,
    required this.currentLat,
    required this.currentLng,
    required this.speedKmh,
    required this.batteryLevel,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] ?? '',
      vanCode: json['van_code'] ?? '',
      driverName: json['driver_name'] ?? '',
      driverPhone: json['driver_phone'] ?? '',
      driverPin: json['driver_pin']?.toString() ?? '1234',
      licensePlate: json['license_plate'] ?? '',
      status: json['status'] ?? 'idle',
      currentLat: (json['current_lat'] as num?)?.toDouble() ?? 5.6037,
      currentLng: (json['current_lng'] as num?)?.toDouble() ?? -0.1870,
      speedKmh: (json['speed_kmh'] as num?)?.toDouble() ?? 0.0,
      batteryLevel: (json['battery_level'] as num?)?.toInt() ?? 100,
    );
  }
}

class Product {
  final String id;
  final String name;
  final String sku;
  final String category;
  final double unitPrice;
  final String? imageUrl;

  Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.category,
    required this.unitPrice,
    this.imageUrl,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      sku: json['sku'] ?? '',
      category: json['category'] ?? 'Bread',
      unitPrice: (json['unit_price'] as num?)?.toDouble() ?? 0.0,
      imageUrl: json['image_url'],
    );
  }
}

class VehicleStock {
  final String id;
  final String vehicleId;
  final String productId;
  final int loadedQuantity;
  final int currentQuantity;
  final int deliveredQuantity;
  final Product? product;

  VehicleStock({
    required this.id,
    required this.vehicleId,
    required this.productId,
    required this.loadedQuantity,
    required this.currentQuantity,
    required this.deliveredQuantity,
    this.product,
  });

  factory VehicleStock.fromJson(Map<String, dynamic> json) {
    return VehicleStock(
      id: json['id'] ?? '',
      vehicleId: json['vehicle_id'] ?? '',
      productId: json['product_id'] ?? '',
      loadedQuantity: (json['loaded_quantity'] as num?)?.toInt() ?? 0,
      currentQuantity: (json['current_quantity'] as num?)?.toInt() ?? 0,
      deliveredQuantity: (json['delivered_quantity'] as num?)?.toInt() ?? 0,
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
    );
  }
}

class Customer {
  final String id;
  final String name;
  final String? contactPerson;
  final String? phone;
  final String address;
  final double lat;
  final double lng;

  Customer({
    required this.id,
    required this.name,
    this.contactPerson,
    this.phone,
    required this.address,
    required this.lat,
    required this.lng,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      contactPerson: json['contact_person'],
      phone: json['phone'],
      address: json['address'] ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
