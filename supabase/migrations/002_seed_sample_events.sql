-- Sample events for testing (all approved)
insert into events (title, description, datetime_start, venue_name, address, city, category, price_min, is_free, is_featured, is_approved, source_platform, lat, lng) values
(
  'Mercadito Orgánico de San Pedro',
  'El mejor mercadito de productos orgánicos del GAM. Frutas, verduras, quesos artesanales, pan, plantas y mucho más. Todos los sábados en el parque de San Pedro.',
  now() + interval '2 days',
  'Parque de San Pedro',
  'San Pedro de Montes de Oca',
  'San José',
  ARRAY['mercado', 'comida'],
  0, true, true, true, 'manual',
  9.9347, -84.0507
),
(
  'Concierto de Jazz en vivo',
  'Una noche de jazz con los mejores músicos del país. Ambiente íntimo, tragos artesanales y buena música.',
  now() + interval '3 days',
  'Jazz Café San Pedro',
  '50m norte de KFC San Pedro',
  'San José',
  ARRAY['musica'],
  8000, false, false, true, 'manual',
  9.9353, -84.0498
),
(
  'Festival de Cine al Aire Libre',
  'Proyecciones de cortometrajes costarricenses bajo las estrellas. Traé tu silla o cobija. Entrada completamente gratis.',
  now() + interval '5 days',
  'Parque La Sabana',
  'Sabana Norte, San José',
  'San José',
  ARRAY['cine', 'arte'],
  0, true, false, true, 'manual',
  9.9387, -84.1022
),
(
  'Taller de Cerámica para Principiantes',
  '3 horas de taller donde aprendés a hacer tu primera pieza de cerámica. Todo el material incluido. Cupos muy limitados.',
  now() + interval '6 days',
  'Estudio La Arcilla',
  'Barrio Escalante, San José',
  'San José',
  ARRAY['talleres', 'arte'],
  15000, false, false, true, 'manual',
  9.9367, -84.0667
),
(
  'Stand-up Comedy Night',
  'La mejor noche de comedia con 5 comediantes nacionales. Ambiente adulto, buenas cervezas y muchas carcajadas.',
  now() + interval '4 days',
  'El Sótano',
  'Barrio Amón, San José',
  'San José',
  ARRAY['standup', 'fiesta'],
  5000, false, true, true, 'manual',
  9.9381, -84.0785
),
(
  'Feria de Artesanías de Cartago',
  'Más de 40 artesanos locales presentan sus trabajos. Cerámica, bisutería, tejidos, madera y más. Entrada libre.',
  now() + interval '7 days',
  'Parque Central de Cartago',
  'Frente a Las Ruinas',
  'Cartago',
  ARRAY['mercado', 'arte'],
  0, true, false, true, 'manual',
  9.8638, -83.9194
);
