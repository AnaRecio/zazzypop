import 'package:flutter/material.dart';
import '../models/event.dart';
import '../services/events_service.dart';
import '../widgets/event_card.dart';
import 'eventos_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: RichText(
          text: const TextSpan(
            children: [
              TextSpan(text: 'zazzy', style: TextStyle(color: Color(0xFF111827), fontWeight: FontWeight.bold, fontSize: 20)),
              TextSpan(text: 'pop', style: TextStyle(color: Color(0xFFF97316), fontWeight: FontWeight.bold, fontSize: 20)),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EventosScreen())),
            child: const Text('Explorar todo', style: TextStyle(color: Color(0xFFF97316))),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFFFF7ED), Color(0xFFFDF2F8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '¿Qué hacemos\neste finde? 🎉',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, height: 1.3),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Eventos en toda Costa Rica',
                    style: TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _QuickFilter(label: '🆓 Gratis', onTap: () => _openFiltered(context, isFree: true)),
                      const SizedBox(width: 8),
                      _QuickFilter(label: '₡ Menos de 10,000', onTap: () => _openFiltered(context, maxPrice: 10000)),
                    ],
                  ),
                ],
              ),
            ),

            const _Section(title: '⚡ Hoy', future: _TodayLoader()),
            const _Section(title: '📅 Esta semana', future: _WeekLoader()),
          ],
        ),
      ),
    );
  }

  void _openFiltered(BuildContext context, {bool isFree = false, int? maxPrice}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => EventosScreen(initialIsFree: isFree, initialMaxPrice: maxPrice),
      ),
    );
  }
}

class _QuickFilter extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _QuickFilter({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget future;
  const _Section({required this.title, required this.future});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          future,
        ],
      ),
    );
  }
}

class _TodayLoader extends StatelessWidget {
  const _TodayLoader();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Event>>(
      future: EventsService.getTodayEvents(),
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return const _Skeleton();
        final events = snap.data ?? [];
        if (events.isEmpty) return const Text('No hay eventos registrados para hoy.', style: TextStyle(color: Colors.grey));
        return _EventList(events: events.take(4).toList());
      },
    );
  }
}

class _WeekLoader extends StatelessWidget {
  const _WeekLoader();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Event>>(
      future: EventsService.getWeekEvents(),
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) return const _Skeleton();
        final events = snap.data ?? [];
        if (events.isEmpty) return const Text('No hay eventos esta semana todavía.', style: TextStyle(color: Colors.grey));
        return _EventList(events: events.take(6).toList());
      },
    );
  }
}

class _EventList extends StatelessWidget {
  final List<Event> events;
  const _EventList({required this.events});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 240,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: events.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => SizedBox(width: 220, child: EventCard(event: events[i])),
      ),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 240,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, __) => Container(
          width: 220,
          decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}
