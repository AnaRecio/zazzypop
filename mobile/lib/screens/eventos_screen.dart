import 'package:flutter/material.dart';
import '../models/event.dart';
import '../services/events_service.dart';
import '../widgets/event_card.dart';

const _cities = ['San José', 'Cartago', 'Heredia', 'Alajuela', 'Liberia'];

const _categories = [
  ('musica', '🎵 Música'),
  ('arte', '🎨 Arte'),
  ('comida', '🍽️ Comida'),
  ('familia', '👨‍👩‍👧 Familia'),
  ('teatro', '🎭 Teatro'),
  ('mercado', '🛍️ Mercadito'),
  ('standup', '🎤 Stand-up'),
  ('talleres', '🛠️ Talleres'),
];

class EventosScreen extends StatefulWidget {
  final bool initialIsFree;
  final int? initialMaxPrice;
  const EventosScreen({super.key, this.initialIsFree = false, this.initialMaxPrice});

  @override
  State<EventosScreen> createState() => _EventosScreenState();
}

class _EventosScreenState extends State<EventosScreen> {
  String? _city;
  String? _category;
  late bool _isFree;
  int? _maxPrice;
  late Future<List<Event>> _future;

  @override
  void initState() {
    super.initState();
    _isFree = widget.initialIsFree;
    _maxPrice = widget.initialMaxPrice;
    _load();
  }

  void _load() {
    setState(() {
      _future = EventsService.getEvents(
        city: _city,
        category: _category,
        isFree: _isFree ? true : null,
        maxPrice: _maxPrice,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Explorar eventos')),
      body: Column(
        children: [
          // Filter bar
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                _FilterChip(
                  label: _city ?? 'Toda CR',
                  active: _city != null,
                  onTap: () => _showCityPicker(),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: '🆓 Gratis',
                  active: _isFree,
                  onTap: () { setState(() => _isFree = !_isFree); _load(); },
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: '₡ -10,000',
                  active: _maxPrice == 10000,
                  onTap: () { setState(() => _maxPrice = _maxPrice == 10000 ? null : 10000); _load(); },
                ),
                const SizedBox(width: 8),
                ..._categories.map((cat) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _FilterChip(
                    label: cat.$2,
                    active: _category == cat.$1,
                    onTap: () { setState(() => _category = _category == cat.$1 ? null : cat.$1); _load(); },
                  ),
                )),
              ],
            ),
          ),

          Expanded(
            child: FutureBuilder<List<Event>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final events = snap.data ?? [];
                if (events.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('🔍', style: TextStyle(fontSize: 40)),
                        SizedBox(height: 8),
                        Text('No encontramos eventos con esos filtros.', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.72,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: events.length,
                  itemBuilder: (_, i) => EventCard(event: events[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showCityPicker() {
    showModalBottomSheet(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            title: const Text('Toda Costa Rica'),
            onTap: () { setState(() => _city = null); _load(); Navigator.pop(context); },
          ),
          ..._cities.map((c) => ListTile(
            title: Text(c),
            onTap: () { setState(() => _city = c); _load(); Navigator.pop(context); },
          )),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFF97316) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? const Color(0xFFF97316) : const Color(0xFFE5E7EB)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : const Color(0xFF374151),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
