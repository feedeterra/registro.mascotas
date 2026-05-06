-- =============================================================
-- Seed: 12 perros de ejemplo para Refugio CASA
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================

INSERT INTO public.pets (name, species, breed, color, size, sex, neutered, photos, primary_photo_idx, type, status, adoption_status, neighborhood, notes, registered_via, created_at)
VALUES
  -- URGENTES
  ('Canela', 'dog', 'Mestiza', 'Marrón claro', 'Mediano', 'Hembra', true,
   '["https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'urgent', 'Centro',
   'Canela fue encontrada en la ruta, muy asustada. Es súper cariñosa y se lleva bien con otros perros. Necesita un hogar urgente.',
   'organic', now() - interval '15 days'),

  ('Mora', 'dog', 'Pitbull mix', 'Atigrada', 'Mediano', 'Hembra', false,
   '["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'urgent', 'Barrio Norte',
   'Mora fue abandonada atada a un poste. Es muy dócil y obediente. Tiene 2 años y está sana.',
   'organic', now() - interval '3 days'),

  ('Nena', 'dog', 'Criolla', 'Negra con patas blancas', 'Mediano', 'Hembra', false,
   '["https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'urgent', 'Ruta 8',
   'Nena fue atropellada y rescatada. Ya se recuperó, está castrada y lista para adopción.',
   'organic', now() - interval '1 day'),

  -- EN REFUGIO
  ('Rocky', 'dog', 'Labrador mix', 'Dorado', 'Grande', 'Macho', true,
   '["https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'shelter', 'Refugio CASA',
   'Rocky es un amor. Le encanta jugar con pelotas y es muy bueno con los chicos. Tiene 4 años.',
   'organic', now() - interval '45 days'),

  ('Toto', 'dog', 'Mestizo', 'Negro', 'Grande', 'Macho', true,
   '["https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'shelter', 'Refugio CASA',
   'Toto es el payaso del refugio. Siempre contento, ideal para una familia activa. Tiene 3 años.',
   'organic', now() - interval '60 days'),

  ('Coco', 'dog', 'Caniche mix', 'Blanco', 'Chico', 'Macho', false,
   '["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'shelter', 'Refugio CASA',
   'Coco es tranquilo y cariñoso. Ideal para departamento. Tiene aproximadamente 5 años.',
   'organic', now() - interval '30 days'),

  ('Firulais', 'dog', 'Mestizo', 'Marrón y blanco', 'Mediano', 'Macho', true,
   '["https://images.unsplash.com/photo-1477884213360-7e9d7dcc8f9b?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'shelter', 'Refugio CASA',
   'Firulais es el más veterano del refugio. Es tranquilo, sabe pasear con correa. Tiene 7 años y mucho amor para dar.',
   'organic', now() - interval '90 days'),

  ('Bruno', 'dog', 'Rottweiler mix', 'Negro y marrón', 'Grande', 'Macho', true,
   '["https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'shelter', 'Refugio CASA',
   'Bruno parece imponente pero es un gigante gentil. Le encanta que lo acaricien. Tiene 5 años.',
   'organic', now() - interval '55 days'),

  ('Manchas', 'dog', 'Dálmata mix', 'Blanco con manchas negras', 'Mediano', 'Macho', false,
   '["https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'shelter', 'Refugio CASA',
   'Manchas es juguetón y muy activo. Necesita una familia con patio. Tiene 2 años.',
   'organic', now() - interval '40 days'),

  -- EN TRÁNSITO
  ('Luna', 'dog', 'Caniche', 'Blanca', 'Chico', 'Hembra', true,
   '["https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'transit', 'Barrio Las Acacias',
   'Luna está en tránsito recuperándose de una cirugía. Es dulce y tranquila. Tiene 3 años.',
   'organic', now() - interval '20 days'),

  ('Laika', 'dog', 'Pastor Alemán mix', 'Negro y fuego', 'Grande', 'Hembra', true,
   '["https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'transit', 'Barrio San Martín',
   'Laika es inteligente y protectora. Ideal para casa con patio. Está en tránsito temporal. Tiene 4 años.',
   'organic', now() - interval '10 days'),

  ('Lola', 'dog', 'Mestiza', 'Canela', 'Chico', 'Hembra', false,
   '["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80"]',
   0, 'stray', 'stray', 'transit', 'Barrio Sur',
   'Lola es una cachorrita de 8 meses, muy juguetona. Se lleva bien con gatos. Está en tránsito.',
   'organic', now() - interval '25 days');
