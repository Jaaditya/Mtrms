class RestaurantTable {
  final int id;
  final String tableNumber;
  final int capacity;
  final String status;

  final String? assignedWaiterId;

  RestaurantTable({
    required this.id,
    required this.tableNumber,
    required this.capacity,
    required this.status,
    this.assignedWaiterId,
  });

  factory RestaurantTable.fromJson(Map<String, dynamic> json) {
    return RestaurantTable(
      id: json['id'],
      tableNumber: json['table_number'],
      capacity: json['capacity'],
      status: json['status'],
      assignedWaiterId: json['assigned_waiter_id']?.toString(),
    );
  }
}
