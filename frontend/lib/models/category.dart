class Category {
  final int id;
  final int tenantId;
  final String name;
  final String? image;
  final int orderIndex;

  Category({
    required this.id,
    required this.tenantId,
    required this.name,
    this.image,
    required this.orderIndex,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      tenantId: json['tenant_id'],
      name: json['name'],
      image: json['image'],
      orderIndex: json['order_index'] ?? 0,
    );
  }
}
