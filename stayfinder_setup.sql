-- =====================================================================
-- Ordning:
--   0. Reset      
--   1. Tabeller   
--   2. Seed data       
--   3. RLS        
--   4. Vy         
--   5. Triggers   
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. RESET
-- ---------------------------------------------------------------------

drop view if exists public.booking_availability;

drop function if exists public.handle_booking_validations() cascade;
drop function if exists public.prevent_past_booking_delete() cascade;

drop table if exists public.bookings cascade;
drop table if exists public.properties cascade;

-- ---------------------------------------------------------------------
-- 1. TABELLER
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

create table public.properties (
  property_id     uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  title           text not null,
  description     text not null,
  city            text not null,
  country         text not null,
  price_per_night int  not null check (price_per_night > 0),
  max_guests      int  not null check (max_guests > 0),
  kind            text not null check (kind in ('apartment', 'villa', 'cabin')),
  image_url       text,
  created_at      timestamptz not null default now()
);

create table public.bookings (
  booking_id      uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties (property_id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  guest_name      text not null,
  guest_email     text not null,
  check_in        date not null,
  check_out       date not null,
  guests          int  not null check (guests > 0),
  -- VG6
  price_per_night int  not null default 0 check (price_per_night > 0),
  total_price     int  not null default 0 check (total_price > 0),
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'cancelled')),
  created_at      timestamptz not null default now(),
  constraint check_out_after_check_in check (check_out > check_in)
);

-- VG2
create extension if not exists btree_gist with schema extensions;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    property_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status <> 'cancelled');

-- ---------------------------------------------------------------------
-- 2. SEED DATA
-- ---------------------------------------------------------------------

insert into public.properties (
  property_id, user_id, title, description, city, country,
  price_per_night, max_guests, kind, image_url
)
select
  v.property_id::uuid, v.user_id::uuid, v.title, v.description, v.city, v.country,
  v.price_per_night, v.max_guests, v.kind, v.image_url
from (values
  ('a0ee6254-8c87-4318-b21a-e53b49734001', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Modern apartment in Stockholm',
   'A bright apartment close to restaurants and public transport.',
   'Stockholm', 'Sweden', 1290, 2, 'apartment',
   'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'),
  ('a0ee6254-8c87-4318-b21a-e53b49734002', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Cozy cabin near the forest',
   'A quiet cabin for guests who want nature and calm evenings.',
   'Falun', 'Sweden', 850, 4, 'cabin',
   'https://s3-eu-north-1.amazonaws.com/py3.visitsweden.com/original_images/04.LodgeLoungeChairsCozy_LoggersLodge_CMSTemplate.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734003', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Seaside house in Gothenburg',
   'A comfortable house with walking distance to the sea.',
   'Gothenburg', 'Sweden', 1790, 6, 'villa',
   'https://media.admiddleeast.com/photos/66bcc3c6e5b5cca88de49cdc/16:9/w_2560%2Cc_limit/HUTLEY%2520&%2520HUMM%2520DEVON%2520PROJECT_PHOTOS%2520BY%2520RACHAEL%2520SMITH_5.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734004', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Luxury penthouse in Malmö',
   'Stunning views over the city skyline and modern interior design.',
   'Malmö', 'Sweden', 2400, 4, 'apartment',
   'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'),
  ('a0ee6254-8c87-4318-b21a-e53b49734005', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Historic stone cottage in Visby',
   'Charm and history combined within the medieval ringwall.',
   'Visby', 'Sweden', 1150, 3, 'cabin',
   'https://cdn.mos.cms.futurecdn.net/5M9qhQANh4BSLrywqV6XBF.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734006', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Central studio in Uppsala',
   'Compact and cozy living right by the river and university.',
   'Uppsala', 'Sweden', 750, 2, 'apartment',
   'https://images.unsplash.com/photo-1536376072261-38c75010e6c9'),
  ('a0ee6254-8c87-4318-b21a-e53b49734007', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Ski chalet in Åre',
   'Directly by the slopes, perfect for winter sports enthusiasts.',
   'Åre', 'Sweden', 2100, 8, 'cabin',
   'https://media.tatler.com/photos/6141db602f0bb1a05b6d46f4/16:9/w_2560%2Cc_limit/Chalet-Zermatt-Peak-2-Tatler-3nov14_pr_b.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734008', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Architect villa in Kalmar',
   'Modern design with large glass windows overlooking the strait.',
   'Kalmar', 'Sweden', 1950, 6, 'villa',
   'https://cdn.mos.cms.futurecdn.net/ERfYwSxkhfmRSPjPoA3CFL-1920-80.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734009', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Old Town apartment in Stockholm',
   'Live surrounded by history in Gamla Stan cobblestone streets.',
   'Stockholm', 'Sweden', 1450, 2, 'apartment',
   'https://cf.bstatic.com/xdata/images/hotel/max1024x768/559951363.jpg?k=96f530cc24a4bf1fb6823b99dd7b4f1218b61d6083f8d51758cd375b309223fb&o='),
  ('a0ee6254-8c87-4318-b21a-e53b49734010', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Lakeside retreat in Siljan',
   'Private dock, boat included, and absolute silence.',
   'Mora', 'Sweden', 950, 4, 'cabin',
   'https://cf.bstatic.com/xdata/images/hotel/max1024x768/661841322.jpg?k=1a934c1705627e869745fd755abb6ff28717f2d093e124056a3b37955acc41d3&o='),
  ('a0ee6254-8c87-4318-b21a-e53b49734011', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Designer loft in Lund',
   'Industrial style loft close to the cathedral and academic parks.',
   'Lund', 'Sweden', 1100, 3, 'apartment',
   'https://cf.bstatic.com/xdata/images/hotel/max1024x768/244354049.jpg?k=766903a9c4f749b51d47d2e5b9a3b6afc211822a570e3dde19d799887ad176c1&o='),
  ('a0ee6254-8c87-4318-b21a-e53b49734012', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Archipelago hideaway in Vaxholm',
   'Traditional red cottage by the sea with private sauna.',
   'Vaxholm', 'Sweden', 1650, 5, 'cabin',
   'https://cms.here-away.com/wp-content/uploads/2026/06/arctic-hideaway-cabin-interior-ocean-view.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734013', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Urban studio in Helsingborg',
   'Stunning view over Öresund and Denmark from the balcony.',
   'Helsingborg', 'Sweden', 990, 2, 'apartment',
   'https://images.adsttc.com/media/images/5be3/3bc4/08a5/e549/e300/031a/newsletter/42449.jpg?1541618579'),
  ('a0ee6254-8c87-4318-b21a-e53b49734014', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Country farmhouse in Österlen',
   'Rolling hills, apple orchards and rustic charm.',
   'Simrishamn', 'Sweden', 1350, 6, 'villa',
   'https://www.theenglishhome.co.uk/_gatsby/file/a0bfeeaf0b5a211d45d954cd03bc84a4/laura%20stephens%20farmhouse%20decor%20living%20room.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734015', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Modern house in Halmstad',
   'Close to Tylösand beach with a large sun deck.',
   'Halmstad', 'Sweden', 1800, 7, 'villa',
   'https://media.houseandgarden.co.uk/photos/68777bdecc005cf2ffdcae29/16:9/w_4992,h_2808,c_limit/240320_Ravensdon093V1-production_digital.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734016', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Northern lights cabin in Kiruna',
   'Remote wilderness cabin optimized for aurora viewing.',
   'Kiruna', 'Sweden', 1500, 3, 'cabin',
   'https://cf.bstatic.com/xdata/images/hotel/max1024x768/664063625.jpg?k=4d17a904f00edcc48f518c5eee67e55aebdcc89f3edd9825bf771357cb01c9b0&o='),
  ('a0ee6254-8c87-4318-b21a-e53b49734017', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Secluded forest cabin in Småland',
   'Deep in the woods, wood-fired stove and complete peace.',
   'Växjö', 'Sweden', 700, 4, 'cabin',
   'https://img.trackhs.com/1080x/https://track-pm.s3.amazonaws.com/soco/image/47f1dda9-ebd9-4cff-b052-9076ab3000c6'),
  ('a0ee6254-8c87-4318-b21a-e53b49734018', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Harbor apartment in Karlskrona',
   'Naval city views right from the living room window.',
   'Karlskrona', 'Sweden', 1050, 3, 'apartment',
   'https://cf.bstatic.com/xdata/images/hotel/max1024x768/775346855.jpg?k=cb33352f3ce42ca87291848cd6e2e2432bd8cffa8358be98308d4dfa5d68316f&o='),
  ('a0ee6254-8c87-4318-b21a-e53b49734019', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Mountain lodge in Sälen',
   'Spacious lodge for large families and groups.',
   'Sälen', 'Sweden', 2300, 10, 'villa',
   'https://usercontent.one/wp/mountainlodge.se/wp-content/uploads/2026/03/IMG_7898-2-1-1024x683.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734020', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Coastal villa in Båstad',
   'Luxury living near tennis courts and sandy beaches.',
   'Båstad', 'Sweden', 2600, 8, 'villa',
   'https://www.lowcountryhome.com/wp-content/uploads/2022/07/32EBeachLag_MoonlightProductions-14-copy.jpg'),
  ('a0ee6254-8c87-4318-b21a-e53b49734021', '5db14e43-c106-46c3-aaae-d0aed5bcc056',
   'Riverside apartment in Umeå',
   'Modern Scandinavian design next to Umeälven.',
   'Umeå', 'Sweden', 920, 2, 'apartment',
   'https://images.squarespace-cdn.com/content/v1/678fc7f7b462b5102aea8406/1741635238067-KCU8FAZZ0WE7Z5FE0YZE/Decorbuddi+Laura+Nicolson+Interior+Design+Bermondsey-8.jpg')
) as v(property_id, user_id, title, description, city, country,
       price_per_night, max_guests, kind, image_url)
join auth.users u on u.id = v.user_id::uuid;

insert into public.bookings (
  property_id, user_id, guest_name, guest_email,
  check_in, check_out, guests, price_per_night, total_price, status
)
select
  v.property_id::uuid, v.user_id::uuid, v.guest_name, v.guest_email,
  v.check_in::date, v.check_out::date, v.guests,
  p.price_per_night,
  (v.check_out::date - v.check_in::date) * p.price_per_night,
  v.status
from (values
  ('a0ee6254-8c87-4318-b21a-e53b49734001', '13f40de9-8205-4732-9ec6-da4f5f936bb4',
   'Anna Karlsson', 'anna.karlsson@example.com', '2026-11-05', '2026-11-08', 2, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734002', '8141108d-dfdb-4f1d-a43f-36dc0d842a94',
   'Erik Ö', 'erik.o@example.com', '2026-11-12', '2026-11-15', 3, 'pending'),
  ('a0ee6254-8c87-4318-b21a-e53b49734004', 'd530f38b-b30d-424b-9f64-e4df8d0e017a',
   'Maria Lindqvist', 'maria.lindqvist@example.com', '2026-12-01', '2026-12-05', 2, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734005', '0b5d21c6-6217-45e2-a873-9bead16c7905',
   'Johan Berg', 'johan.berg@example.com', '2026-11-20', '2026-11-25', 3, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734007', '13f40de9-8205-4732-9ec6-da4f5f936bb4',
   'Karin Holm', 'karin.holm@example.com', '2026-02-10', '2026-02-15', 4, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734008', '8141108d-dfdb-4f1d-a43f-36dc0d842a94',
   'Lars Ek', 'lars.ek@example.com', '2026-03-01', '2026-03-05', 2, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734009', 'd530f38b-b30d-424b-9f64-e4df8d0e017a',
   'Sofia Wallin', 'sofia.wallin@example.com', '2026-04-12', '2026-04-16', 2, 'cancelled'),
  ('a0ee6254-8c87-4318-b21a-e53b49734010', '0b5d21c6-6217-45e2-a873-9bead16c7905',
   'Per Dahl', 'per.dahl@example.com', '2026-01-15', '2026-01-20', 3, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734011', '13f40de9-8205-4732-9ec6-da4f5f936bb4',
   'Emma Åström', 'emma.astrom@example.com', '2026-05-05', '2026-05-10', 2, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734012', '8141108d-dfdb-4f1d-a43f-36dc0d842a94',
   'Nils Holmgren', 'nils.h@example.com', '2026-06-01', '2026-06-08', 4, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734013', 'd530f38b-b30d-424b-9f64-e4df8d0e017a',
   'Sara Blom', 'sara.blom@example.com', '2026-07-10', '2026-07-14', 1, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734014', '0b5d21c6-6217-45e2-a873-9bead16c7905',
   'Tobias Månsson', 'tobias.m@example.com', '2026-08-15', '2026-08-20', 5, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734015', '13f40de9-8205-4732-9ec6-da4f5f936bb4',
   'Hanna Sjöberg', 'hanna.s@example.com', '2026-09-01', '2026-09-06', 4, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734016', '8141108d-dfdb-4f1d-a43f-36dc0d842a94',
   'Mikael Björk', 'mikael.b@example.com', '2026-03-10', '2026-03-15', 2, 'cancelled'),
  ('a0ee6254-8c87-4318-b21a-e53b49734017', 'd530f38b-b30d-424b-9f64-e4df8d0e017a',
   'Elin Gran', 'elin.gran@example.com', '2026-02-20', '2026-02-25', 3, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734018', '0b5d21c6-6217-45e2-a873-9bead16c7905',
   'Viktor Palm', 'viktor.palm@example.com', '2026-04-01', '2026-04-05', 2, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734019', '13f40de9-8205-4732-9ec6-da4f5f936bb4',
   'Amanda Lind', 'amanda.lind@example.com', '2026-05-15', '2026-05-22', 6, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734020', '8141108d-dfdb-4f1d-a43f-36dc0d842a94',
   'Fredrik Löw', 'fredrik.l@example.com', '2026-06-10', '2026-06-17', 4, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734021', 'd530f38b-b30d-424b-9f64-e4df8d0e017a',
   'Ida Ström', 'ida.strom@example.com', '2026-07-01', '2026-07-04', 2, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734007', '0b5d21c6-6217-45e2-a873-9bead16c7905',
   'Rasmus Norberg', 'rasmus.n@example.com', '2026-12-10', '2026-12-17', 4, 'pending'),
  ('a0ee6254-8c87-4318-b21a-e53b49734008', '13f40de9-8205-4732-9ec6-da4f5f936bb4',
   'Matilda Sundin', 'matilda.s@example.com', '2026-11-22', '2026-11-28', 2, 'pending'),
  ('a0ee6254-8c87-4318-b21a-e53b49734012', '8141108d-dfdb-4f1d-a43f-36dc0d842a94',
   'Jonas Falk', 'jonas.falk@example.com', '2026-12-23', '2026-12-30', 3, 'confirmed'),
  ('a0ee6254-8c87-4318-b21a-e53b49734015', 'd530f38b-b30d-424b-9f64-e4df8d0e017a',
   'Beata Ceder', 'beata.c@example.com', '2026-11-15', '2026-11-19', 4, 'pending'),
  ('a0ee6254-8c87-4318-b21a-e53b49734019', '0b5d21c6-6217-45e2-a873-9bead16c7905',
   'David Zetterberg', 'david.z@example.com', '2026-12-15', '2026-12-22', 8, 'confirmed')
) as v(property_id, user_id, guest_name, guest_email,
       check_in, check_out, guests, status)
join public.properties p on p.property_id = v.property_id::uuid
join auth.users u        on u.id          = v.user_id::uuid;

-- ---------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------

-- ===== properties =====
alter table public.properties enable row level security;

drop policy if exists "Anyone can read properties" on public.properties;
drop policy if exists "Authenticated users can insert their own properties" on public.properties;
drop policy if exists "Owners can update properties" on public.properties;
drop policy if exists "Owners can delete properties" on public.properties;

-- Alla (även utloggade) kan läsa boenden
create policy "Anyone can read properties"
on public.properties for select
using (true);

-- Inloggade kan skapa boenden kopplade till sitt eget id
create policy "Authenticated users can insert their own properties"
on public.properties for insert
to authenticated
with check (auth.uid() = user_id);

-- Bara ägaren kan ändra sitt boende
create policy "Owners can update properties"
on public.properties for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Bara ägaren kan ta bort sitt boende
create policy "Owners can delete properties"
on public.properties for delete
to authenticated
using (auth.uid() = user_id);

-- ===== bookings =====
alter table public.bookings enable row level security;

drop policy if exists "Users can read their own bookings or property owner bookings" on public.bookings;
drop policy if exists "Authenticated users can insert their own bookings" on public.bookings;
drop policy if exists "Guests and owners can update bookings" on public.bookings;
drop policy if exists "Guests and owners can delete bookings" on public.bookings;

-- Gästen som gjort bokningen ELLER boendets ägare kan läsa den
create policy "Users can read their own bookings or property owner bookings"
on public.bookings for select
to authenticated
using (
  auth.uid() = user_id
  or auth.uid() in (
    select p.user_id from public.properties p
    where p.property_id = bookings.property_id
  )
);

-- Inloggade kan bara skapa bokningar kopplade till sitt eget id
create policy "Authenticated users can insert their own bookings"
on public.bookings for insert
to authenticated
with check (auth.uid() = user_id);

-- Gästen eller boendets ägare kan uppdatera en bokning
create policy "Guests and owners can update bookings"
on public.bookings for update
to authenticated
using (
  auth.uid() = user_id
  or auth.uid() in (
    select p.user_id from public.properties p
    where p.property_id = bookings.property_id
  )
)
with check (
  auth.uid() = user_id
  or auth.uid() in (
    select p.user_id from public.properties p
    where p.property_id = bookings.property_id
  )
);

-- Gästen eller boendets ägare kan ta bort en bokning
create policy "Guests and owners can delete bookings"
on public.bookings for delete
to authenticated
using (
  auth.uid() = user_id
  or auth.uid() in (
    select p.user_id from public.properties p
    where p.property_id = bookings.property_id
  )
);

-- ---------------------------------------------------------------------
-- 4. VY
-- ---------------------------------------------------------------------

create view public.booking_availability as
select property_id, check_in, check_out
from public.bookings
where status <> 'cancelled';

grant select on public.booking_availability to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. TRIGGERS
-- ---------------------------------------------------------------------

create or replace function public.handle_booking_validations()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_max_guests int;
  v_price      int;
  v_today      date := (now() at time zone 'Europe/Stockholm')::date;
  v_uid        uuid := auth.uid();
begin
  -- VG4
  if (TG_OP = 'INSERT') and (NEW.status <> 'pending') then
    raise exception 'A new booking must start as pending'
    using errcode = 'P0001', hint = 'INVALID_STATUS_TRANSITION';
  end if;

  if (TG_OP = 'UPDATE') then
    if NEW.property_id <> OLD.property_id or NEW.user_id <> OLD.user_id then
      raise exception 'The property and the guest of a booking cannot be changed'
      using errcode = 'P0001', hint = 'IMMUTABLE_FIELD';
    end if;

    -- VG4
    if (OLD.status = 'cancelled') then
      raise exception 'A cancelled booking cannot be changed'
      using errcode = 'P0001', hint = 'INVALID_STATUS_TRANSITION';
    end if;

    -- VG5
    if (OLD.check_in < v_today) then
      raise exception 'Cannot modify or cancel a booking whose check-in date has already passed'
      using errcode = 'P0001', hint = 'PAST_BOOKING_MODIFICATION_NOT_ALLOWED';
    end if;

    -- VG4
    if (NEW.status is distinct from OLD.status) then
      if not (
        (OLD.status = 'pending'   and NEW.status in ('confirmed', 'cancelled'))
        or (OLD.status = 'confirmed' and NEW.status = 'cancelled')
      ) then
        raise exception 'A % booking cannot become %', OLD.status, NEW.status
        using errcode = 'P0001', hint = 'INVALID_STATUS_TRANSITION';
      end if;

      if (NEW.status = 'confirmed') and (v_uid is not null) then
        if not exists (
          select 1 from public.properties p
          where p.property_id = NEW.property_id and p.user_id = v_uid
        ) then
          raise exception 'Only the owner of the property can confirm a booking'
          using errcode = 'P0001', hint = 'FORBIDDEN';
        end if;
      end if;
    end if;

    -- VG6
    NEW.price_per_night := OLD.price_per_night;
  end if;

  if (NEW.check_out <= NEW.check_in) then
    raise exception 'Check-out must be after check-in'
    using errcode = 'P0001', hint = 'INVALID_DATES';
  end if;

  -- VG5
  if (NEW.check_in < v_today) then
    raise exception 'Check-in date cannot be in the past'
    using errcode = 'P0001', hint = 'PAST_CHECKIN_NOT_ALLOWED';
  end if;

  -- VG3
  if (TG_OP = 'INSERT') or (NEW.guests is distinct from OLD.guests) then
    select max_guests, price_per_night
    into v_max_guests, v_price
    from public.properties
    where property_id = NEW.property_id;

    if not found then
      raise exception 'Property not found'
      using errcode = 'P0001', hint = 'PROPERTY_NOT_FOUND';
    end if;

    if (NEW.guests > v_max_guests) then
      raise exception 'Number of guests exceeds the maximum capacity of the property'
      using errcode = 'P0001', hint = 'CAPACITY_EXCEEDED';
    end if;

    -- VG6
    if (TG_OP = 'INSERT') then
      NEW.price_per_night := v_price;
    end if;
  end if;

  -- VG6
  NEW.total_price := (NEW.check_out - NEW.check_in) * NEW.price_per_night;

  return NEW;
end;
$$;

create trigger booking_validations_trigger
before insert or update on public.bookings
for each row
execute function public.handle_booking_validations();

-- VG5
create or replace function public.prevent_past_booking_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return OLD;
  end if;

  if (OLD.check_in < (now() at time zone 'Europe/Stockholm')::date) then
    raise exception 'Cannot delete a booking whose check-in date has already passed'
    using errcode = 'P0001', hint = 'PAST_BOOKING_MODIFICATION_NOT_ALLOWED';
  end if;

  return OLD;
end;
$$;

create trigger prevent_past_booking_delete_trigger
before delete on public.bookings
for each row
execute function public.prevent_past_booking_delete();