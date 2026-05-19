import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../models/event.dart';

class EventDetailScreen extends StatelessWidget {
  final Event event;
  const EventDetailScreen({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    final dateLabel = DateFormat("EEEE d 'de' MMMM, yyyy", 'es').format(event.datetimeStart);
    final timeLabel = DateFormat('HH:mm', 'es').format(event.datetimeStart);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: event.imageUrl != null
                  ? Image.network(event.imageUrl!, fit: BoxFit.cover)
                  : Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFFED7AA), Color(0xFFFBCFE8)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                    ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.share),
                onPressed: () => Share.share('${event.title}\n\nDescubrí este evento en ZazzyPop'),
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category chips
                  if (event.category.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      children: event.category.map((c) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(c, style: const TextStyle(color: Color(0xFFEA580C), fontSize: 12, fontWeight: FontWeight.w600)),
                      )).toList(),
                    ),
                  const SizedBox(height: 12),

                  Text(event.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, height: 1.2)),
                  const SizedBox(height: 20),

                  // Info card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Column(
                      children: [
                        _InfoRow(icon: Icons.calendar_today_outlined, label: dateLabel),
                        const Divider(height: 16),
                        _InfoRow(icon: Icons.access_time, label: timeLabel),
                        const Divider(height: 16),
                        _InfoRow(icon: Icons.location_on_outlined, label: '${event.venueName}\n${event.address}, ${event.city}'),
                        const Divider(height: 16),
                        _InfoRow(
                          icon: Icons.sell_outlined,
                          label: event.priceLabel,
                          labelColor: event.isFree ? const Color(0xFF16A34A) : null,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Actions
                  if (event.sourceUrl != null)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => launchUrl(Uri.parse(event.sourceUrl!)),
                        icon: const Icon(Icons.open_in_new),
                        label: const Text('Ver más / Entradas'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF97316),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  if (event.sourceUrl != null) const SizedBox(height: 10),

                  if (event.lat != null && event.lng != null)
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => launchUrl(
                          Uri.parse('https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}'),
                        ),
                        icon: const Icon(Icons.directions),
                        label: const Text('Cómo llegar'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Description
                  if (event.description.isNotEmpty) ...[
                    const Text('Sobre el evento', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(event.description, style: const TextStyle(color: Color(0xFF4B5563), height: 1.6)),
                    const SizedBox(height: 40),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? labelColor;
  const _InfoRow({required this.icon, required this.label, this.labelColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: const Color(0xFFF97316)),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(color: labelColor ?? const Color(0xFF374151), fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }
}
