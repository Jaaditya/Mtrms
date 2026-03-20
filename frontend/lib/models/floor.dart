import 'restaurant_table.dart';

class Floor {
  final int id;
  final String name;
  final List<RestaurantTable> tables;

  Floor({required this.id, required this.name, required this.tables});

  factory Floor.fromJson(Map<String, dynamic> json) {
    return Floor(
      id: json['id'],
      name: json['name'],
      tables:
          (json['tables'] as List?)
              ?.map((t) => RestaurantTable.fromJson(t))
              .toList() ??
          [],
    );
  }
}
