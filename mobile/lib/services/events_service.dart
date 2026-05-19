import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/event.dart';

class EventsService {
  static final _db = Supabase.instance.client;

  static Future<List<Event>> getEvents({
    String? city,
    String? category,
    bool? isFree,
    int? maxPrice,
    DateTime? dateFrom,
    DateTime? dateTo,
  }) async {
    var query = _db
        .from('events')
        .select()
        .eq('is_approved', true);

    if (city != null) query = query.eq('city', city);
    if (isFree == true) query = query.eq('is_free', true);
    if (maxPrice != null) query = query.lte('price_min', maxPrice);
    if (category != null) query = query.contains('category', [category]);
    if (dateFrom != null) query = query.gte('datetime_start', dateFrom.toIso8601String());
    if (dateTo != null) query = query.lte('datetime_start', dateTo.toIso8601String());

    final data = await query
        .order('datetime_start', ascending: true)
        .limit(100);

    return data.map((m) => Event.fromMap(m)).toList();
  }

  static Future<Event?> getById(String id) async {
    final data = await _db
        .from('events')
        .select()
        .eq('id', id)
        .single();
    return Event.fromMap(data);
  }

  static Future<List<Event>> getTodayEvents() async {
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    final end = start.add(const Duration(days: 1));
    return getEvents(dateFrom: start, dateTo: end);
  }

  static Future<List<Event>> getWeekEvents() async {
    final now = DateTime.now();
    return getEvents(dateFrom: now, dateTo: now.add(const Duration(days: 7)));
  }
}
