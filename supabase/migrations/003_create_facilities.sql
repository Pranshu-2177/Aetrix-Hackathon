create extension if not exists pgcrypto;

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  facility_type text not null check (facility_type in ('phc', 'chc', 'hospital')),
  lat double precision not null,
  lng double precision not null,
  address text,
  block text,
  district text,
  contact text,
  rating numeric(2,1) not null default 4.0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  specialties text[] not null default '{}',
  recommended_for text[] not null default '{}',
  maps_uri text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists facilities_name_lat_lng_idx on public.facilities(name, lat, lng);
create index if not exists facilities_district_idx on public.facilities(district);
create index if not exists facilities_block_idx on public.facilities(block);
create index if not exists facilities_active_idx on public.facilities(is_active);

alter table public.facilities enable row level security;

drop policy if exists "facilities_select_authenticated" on public.facilities;
create policy "facilities_select_authenticated"
on public.facilities
for select
to authenticated
using (is_active = true);

insert into public.facilities (
  name,
  facility_type,
  lat,
  lng,
  address,
  block,
  district,
  contact,
  rating,
  review_count,
  specialties,
  recommended_for,
  maps_uri,
  is_active
)
values
  (
    'Primary Health Centre, Sanand',
    'phc',
    22.9950,
    72.3810,
    'Sanand, Ahmedabad, Gujarat',
    'Sanand',
    'Ahmedabad',
    '02717-222301',
    4.2,
    148,
    array['general','fever','infection','women_child'],
    array['clinic'],
    'https://www.google.com/maps/search/?api=1&query=22.9950,72.3810',
    true
  ),
  (
    'Primary Health Centre, Bareja',
    'phc',
    22.8600,
    72.5830,
    'Bareja, Ahmedabad, Gujarat',
    'Daskroi',
    'Ahmedabad',
    '02718-282040',
    4.1,
    126,
    array['general','fever','infection','women_child'],
    array['clinic'],
    'https://www.google.com/maps/search/?api=1&query=22.8600,72.5830',
    true
  ),
  (
    'Primary Health Centre, Dholka Rural',
    'phc',
    22.7270,
    72.4410,
    'Dholka, Ahmedabad, Gujarat',
    'Dholka',
    'Ahmedabad',
    '02714-222410',
    4.0,
    94,
    array['general','fever','infection'],
    array['clinic'],
    'https://www.google.com/maps/search/?api=1&query=22.7270,72.4410',
    true
  ),
  (
    'Community Health Centre, Bavla',
    'chc',
    22.8280,
    72.3660,
    'Bavla, Ahmedabad, Gujarat',
    'Bavla',
    'Ahmedabad',
    '02714-232055',
    4.4,
    208,
    array['general','trauma','respiratory','women_child'],
    array['clinic','emergency'],
    'https://www.google.com/maps/search/?api=1&query=22.8280,72.3660',
    true
  ),
  (
    'Community Health Centre, Dehgam',
    'chc',
    23.1700,
    72.8200,
    'Dehgam, Gandhinagar, Gujarat',
    'Dehgam',
    'Gandhinagar',
    '02716-232801',
    4.3,
    186,
    array['general','trauma','fever','respiratory'],
    array['clinic','emergency'],
    'https://www.google.com/maps/search/?api=1&query=23.1700,72.8200',
    true
  ),
  (
    'Referral Hospital, Dholka',
    'hospital',
    22.7278,
    72.4425,
    'Dholka, Ahmedabad, Gujarat',
    'Dholka',
    'Ahmedabad',
    '02714-222051',
    4.5,
    264,
    array['general','trauma','respiratory','cardiac'],
    array['clinic','emergency'],
    'https://www.google.com/maps/search/?api=1&query=22.7278,72.4425',
    true
  ),
  (
    'Civil Hospital Ahmedabad',
    'hospital',
    23.0510,
    72.6030,
    'Ahmedabad, Gujarat',
    'Ahmedabad City',
    'Ahmedabad',
    '079-22683721',
    4.7,
    1260,
    array['trauma','respiratory','cardiac','women_child','infection'],
    array['emergency'],
    'https://www.google.com/maps/search/?api=1&query=23.0510,72.6030',
    true
  ),
  (
    'Sola Civil Hospital',
    'hospital',
    23.0700,
    72.5160,
    'Sola, Ahmedabad, Gujarat',
    'Ahmedabad City',
    'Ahmedabad',
    '079-27492303',
    4.6,
    884,
    array['trauma','respiratory','cardiac','infection'],
    array['emergency'],
    'https://www.google.com/maps/search/?api=1&query=23.0700,72.5160',
    true
  ),
  (
    'SVP Hospital',
    'hospital',
    23.0260,
    72.5800,
    'Ahmedabad, Gujarat',
    'Ahmedabad City',
    'Ahmedabad',
    '079-25621424',
    4.8,
    1432,
    array['trauma','respiratory','cardiac','infection','women_child'],
    array['emergency'],
    'https://www.google.com/maps/search/?api=1&query=23.0260,72.5800',
    true
  ),
  (
    'GMERS General Hospital, Gandhinagar',
    'hospital',
    23.2150,
    72.6360,
    'Gandhinagar, Gujarat',
    'Gandhinagar',
    'Gandhinagar',
    '079-23275060',
    4.5,
    632,
    array['trauma','respiratory','cardiac','infection'],
    array['emergency'],
    'https://www.google.com/maps/search/?api=1&query=23.2150,72.6360',
    true
  )
on conflict (name, lat, lng) do update set
  facility_type = excluded.facility_type,
  address = excluded.address,
  block = excluded.block,
  district = excluded.district,
  contact = excluded.contact,
  rating = excluded.rating,
  review_count = excluded.review_count,
  specialties = excluded.specialties,
  recommended_for = excluded.recommended_for,
  maps_uri = excluded.maps_uri,
  is_active = excluded.is_active;
