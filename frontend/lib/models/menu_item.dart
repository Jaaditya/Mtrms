class MenuItem {
  final int id;
  final int categoryId;
  final String name;
  final String? nepaliName;
  final String? description;
  final String? image;
  final double price;
  final bool isAvailable;
  final List<String> dietaryTags;

  MenuItem({
    required this.id,
    required this.categoryId,
    required this.name,
    this.nepaliName,
    this.description,
    this.image,
    required this.price,
    required this.isAvailable,
    required this.dietaryTags,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'],
      categoryId: json['category_id'],
      name: json['name'],
      nepaliName: json['nepali_name'],
      description: json['description'],
      image: json['image'],
      price: double.parse(json['price'].toString()),
      isAvailable: json['is_available'] == 1 || json['is_available'] == true,
      dietaryTags:
          (json['dietary_tags'] as List?)?.map((e) => e.toString()).toList() ??
          [],
    );
  }
}
