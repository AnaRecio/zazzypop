class Event {
  final String id;
  final String title;
  final String description;
  final DateTime datetimeStart;
  final DateTime? datetimeEnd;
  final String venueName;
  final String address;
  final String city;
  final List<String> category;
  final int priceMin;
  final int? priceMax;
  final bool isFree;
  final String? imageUrl;
  final String? sourceUrl;
  final bool isFeatured;
  final double? lat;
  final double? lng;

  const Event({
    required this.id,
    required this.title,
    required this.description,
    required this.datetimeStart,
    this.datetimeEnd,
    required this.venueName,
    required this.address,
    required this.city,
    required this.category,
    required this.priceMin,
    this.priceMax,
    required this.isFree,
    this.imageUrl,
    this.sourceUrl,
    required this.isFeatured,
    this.lat,
    this.lng,
  });

  factory Event.fromMap(Map<String, dynamic> map) {
    return Event(
      id: map['id'] as String,
      title: map['title'] as String,
      description: map['description'] as String? ?? '',
      datetimeStart: DateTime.parse(map['datetime_start'] as String),
      datetimeEnd: map['datetime_end'] != null
          ? DateTime.parse(map['datetime_end'] as String)
          : null,
      venueName: map['venue_name'] as String,
      address: map['address'] as String? ?? '',
      city: map['city'] as String,
      category: List<String>.from(map['category'] as List),
      priceMin: map['price_min'] as int? ?? 0,
      priceMax: map['price_max'] as int?,
      isFree: map['is_free'] as bool? ?? false,
      imageUrl: map['image_url'] as String?,
      sourceUrl: map['source_url'] as String?,
      isFeatured: map['is_featured'] as bool? ?? false,
      lat: (map['lat'] as num?)?.toDouble(),
      lng: (map['lng'] as num?)?.toDouble(),
    );
  }

  String get priceLabel {
    if (isFree) return 'Gratis';
    if (priceMin == 0) return 'Entrada libre';
    if (priceMax != null) {
      return '₡${_fmt(priceMin)} – ₡${_fmt(priceMax!)}';
    }
    return 'Desde ₡${_fmt(priceMin)}';
  }

  String _fmt(int n) => n.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]},',
      );
}
