import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../models/event.dart';
import '../screens/evento_detail_screen.dart';

const _categoryEmojis = {
  'musica': '🎵',
  'arte': '🎨',
  'comida': '🍽️',
  'familia': '👨‍👩‍👧',
  'teatro': '🎭',
  'cine': '🎬',
  'deporte': '⚽',
  'talleres': '🛠️',
  'fiesta': '🎉',
  'mercado': '🛍️',
  'standup': '🎤',
  'brunch': '☕',
  'otro': '✨',
};

class EventCard extends StatelessWidget {
  final Event event;
  final bool featured;
  final bool fullWidth;

  const EventCard({super.key, required this.event, this.featured = false, this.fullWidth = false});

  @override
  Widget build(BuildContext context) {
    final emoji = _categoryEmojis[event.category.firstOrNull] ?? '✨';
    final dateLabel = DateFormat("EEE d MMM · HH:mm", 'es').format(event.datetimeStart);

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => EventDetailScreen(event: event)),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: featured
              ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 2))]
              : null,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            AspectRatio(
              aspectRatio: fullWidth ? 21 / 9 : 16 / 9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  event.imageUrl != null && !kIsWeb
                      ? CachedNetworkImage(
                          imageUrl: event.imageUrl!,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => _placeholder(emoji),
                        )
                      : _placeholder(emoji),
                  if (event.isFeatured)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF97316),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('Destacado', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: event.isFree ? const Color(0xFFDCFCE7) : Colors.white.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        event.priceLabel,
                        style: TextStyle(
                          color: event.isFree ? const Color(0xFF16A34A) : const Color(0xFF374151),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.category.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$emoji ${event.category.first}',
                        style: const TextStyle(color: Color(0xFFEA580C), fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ),
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, height: 1.3),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 13, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 4),
                      Expanded(child: Text(dateLabel, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)))),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${event.venueName} · ${event.city}',
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder(String emoji) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFFED7AA), Color(0xFFFBCFE8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(child: Text(emoji, style: const TextStyle(fontSize: 40))),
    );
  }
}
