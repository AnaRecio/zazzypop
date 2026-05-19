import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/event.dart';
import '../services/events_service.dart';
import 'evento_detail_screen.dart';

const _sanjose = LatLng(9.9281, -84.0907);

class MapaScreen extends StatefulWidget {
  const MapaScreen({super.key});

  @override
  State<MapaScreen> createState() => _MapaScreenState();
}

class _MapaScreenState extends State<MapaScreen> {
  late Future<List<Event>> _future;
  Event? _selected;

  @override
  void initState() {
    super.initState();
    _future = EventsService.getEvents();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mapa de eventos')),
      body: FutureBuilder<List<Event>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final events = (snap.data ?? [])
              .where((e) => e.lat != null && e.lng != null)
              .toList();

          return Stack(
            children: [
              FlutterMap(
                options: const MapOptions(initialCenter: _sanjose, initialZoom: 11),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.zazzypop.eventos_cr',
                  ),
                  MarkerLayer(
                    markers: events.map((e) => Marker(
                      point: LatLng(e.lat!, e.lng!),
                      width: 36,
                      height: 36,
                      child: GestureDetector(
                        onTap: () => setState(() => _selected = e),
                        child: Container(
                          decoration: BoxDecoration(
                            color: e.isFree ? const Color(0xFF16A34A) : const Color(0xFFF97316),
                            shape: BoxShape.circle,
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4)],
                          ),
                          child: const Icon(Icons.place, color: Colors.white, size: 20),
                        ),
                      ),
                    )).toList(),
                  ),
                ],
              ),

              // Selected event card
              if (_selected != null)
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => EventDetailScreen(event: _selected!)),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 12)],
                      ),
                      child: Row(
                        children: [
                          if (_selected!.imageUrl != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Image.network(_selected!.imageUrl!, width: 56, height: 56, fit: BoxFit.cover),
                            )
                          else
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF7ED),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.event, color: Color(0xFFF97316)),
                            ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_selected!.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.bold)),
                                Text(_selected!.venueName, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                Text(_selected!.priceLabel,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: _selected!.isFree ? const Color(0xFF16A34A) : const Color(0xFFF97316),
                                    )),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: Colors.grey),
                        ],
                      ),
                    ),
                  ),
                ),

              // Close button
              if (_selected != null)
                Positioned(
                  bottom: 100,
                  right: 16,
                  child: FloatingActionButton.small(
                    onPressed: () => setState(() => _selected = null),
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.grey,
                    child: const Icon(Icons.close),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
