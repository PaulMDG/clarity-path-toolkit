
-- ============ ROLES ============
create type public.app_role as enum ('admin', 'superadmin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin','superadmin')
  )
$$;

create policy "Users see own roles" on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage roles" on public.user_roles for all using (public.is_admin()) with check (public.is_admin());

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "View own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "Update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "Insert own profile" on public.profiles for insert with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============ SITE SETTINGS ============
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text default 'ClarityPath',
  tagline text,
  email text,
  phone text,
  address text,
  footer_description text,
  logo_url text,
  favicon_url text,
  default_seo_title text,
  default_meta_description text,
  stripe_publishable_key text,
  calendly_url_free text,
  calendly_url_paid text,
  google_analytics_id text,
  social_links jsonb default '{}'::jsonb,
  homepage_content jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.site_settings enable row level security;
create policy "Public read settings" on public.site_settings for select using (true);
create policy "Admin manage settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- ============ PAGES ============
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  seo_title text,
  meta_description text,
  featured_image_url text,
  content text,
  status text default 'draft' check (status in ('draft','published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.pages enable row level security;
create policy "Public read published pages" on public.pages for select using (status = 'published');
create policy "Admin manage pages" on public.pages for all using (public.is_admin()) with check (public.is_admin());

-- ============ NAVIGATION ============
create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  link_type text not null check (link_type in ('page','service','blog_category','resource','custom')),
  target_slug text,
  custom_url text,
  parent_id uuid references public.navigation_items(id) on delete set null,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.navigation_items enable row level security;
create policy "Public read active nav" on public.navigation_items for select using (is_active = true);
create policy "Admin manage nav" on public.navigation_items for all using (public.is_admin()) with check (public.is_admin());

-- ============ SERVICES ============
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  icon text,
  short_description text,
  content text,
  featured_image_url text,
  seo_title text,
  meta_description text,
  status text default 'draft' check (status in ('draft','published')),
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.services enable row level security;
create policy "Public read published services" on public.services for select using (status = 'published');
create policy "Admin manage services" on public.services for all using (public.is_admin()) with check (public.is_admin());

-- ============ BLOG ============
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);
alter table public.blog_categories enable row level security;
create policy "Public read categories" on public.blog_categories for select using (true);
create policy "Admin manage categories" on public.blog_categories for all using (public.is_admin()) with check (public.is_admin());

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category_id uuid references public.blog_categories(id) on delete set null,
  tags text[],
  featured_image_url text,
  excerpt text,
  content text,
  seo_title text,
  meta_description text,
  status text default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.blog_posts enable row level security;
create policy "Public read published posts" on public.blog_posts for select using (status = 'published');
create policy "Admin manage posts" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

-- ============ RESOURCES ============
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('article','pdf','guide','checklist','external_link')),
  category text,
  description text,
  file_url text,
  external_url text,
  featured_image_url text,
  status text default 'draft' check (status in ('draft','published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.resources enable row level security;
create policy "Public read published resources" on public.resources for select using (status = 'published');
create policy "Admin manage resources" on public.resources for all using (public.is_admin()) with check (public.is_admin());

-- ============ FAQS ============
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.faqs enable row level security;
create policy "Public read faqs" on public.faqs for select using (true);
create policy "Admin manage faqs" on public.faqs for all using (public.is_admin()) with check (public.is_admin());

-- ============ TESTIMONIALS ============
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  location text,
  testimonial_text text not null,
  rating int check (rating between 1 and 5),
  status text default 'draft' check (status in ('draft','published')),
  created_at timestamptz default now()
);
alter table public.testimonials enable row level security;
create policy "Public read published testimonials" on public.testimonials for select using (status = 'published');
create policy "Admin manage testimonials" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

-- ============ CONSULTATION TYPES ============
create table public.consultation_types (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  duration_minutes int default 60,
  price_cents int default 0,
  stripe_price_id text,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.consultation_types enable row level security;
create policy "Public read active types" on public.consultation_types for select using (is_active = true);
create policy "Admin manage types" on public.consultation_types for all using (public.is_admin()) with check (public.is_admin());

-- ============ BOOKINGS ============
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  consultation_type_id uuid references public.consultation_types(id) on delete set null,
  payment_status text default 'pending' check (payment_status in ('free','pending','paid','failed')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  calendly_event_url text,
  notes text,
  created_at timestamptz default now()
);
alter table public.bookings enable row level security;
create policy "Public insert bookings" on public.bookings for insert with check (true);
create policy "Admin read bookings" on public.bookings for select using (public.is_admin());
create policy "Admin update bookings" on public.bookings for update using (public.is_admin());
create policy "Admin delete bookings" on public.bookings for delete using (public.is_admin());

-- ============ CONTACT SUBMISSIONS ============
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.contact_submissions enable row level security;
create policy "Public insert contact" on public.contact_submissions for insert with check (true);
create policy "Admin read contact" on public.contact_submissions for select using (public.is_admin());
create policy "Admin update contact" on public.contact_submissions for update using (public.is_admin());
create policy "Admin delete contact" on public.contact_submissions for delete using (public.is_admin());

-- ============ SEED ============
insert into public.site_settings (business_name, tagline, email, phone, address, footer_description, social_links, homepage_content)
values (
  'ClarityPath',
  'Ireland Immigration Support',
  'hello@claritypath.ie',
  '+353 87 123 4567',
  'Dublin, Ireland',
  'Structured immigration guidance for individuals and families in Ireland.',
  '{"facebook":"","instagram":"","linkedin":"","twitter":""}'::jsonb,
  '{
    "hero": {
      "eyebrow": "STRUCTURED GUIDANCE. CLEARER FUTURES.",
      "headline_pre": "Clear guidance through the",
      "headline_accent": "Irish",
      "headline_post": "immigration journey.",
      "subheading": "We help individuals and families prepare documentation, understand next steps, and navigate immigration processes with greater clarity and confidence.",
      "primary_cta": "Book a Consultation",
      "secondary_cta": "Learn More",
      "trust_indicators": [
        {"icon":"Lock","label":"Confidential Support"},
        {"icon":"ClipboardList","label":"Structured Guidance"},
        {"icon":"Globe","label":"Ireland Focused"},
        {"icon":"MessageCircle","label":"Consultation Based Approach"}
      ]
    },
    "process_steps": [
      {"icon":"Calendar","number":"01","title":"Book a Consultation","description":"Schedule an initial call to discuss your situation."},
      {"icon":"Search","number":"02","title":"Review Your Situation","description":"We review your circumstances and identify the best pathway."},
      {"icon":"FileCheck","number":"03","title":"Prepare & Organise","description":"Organise documentation clearly and completely."},
      {"icon":"ArrowRight","number":"04","title":"Move Forward with Confidence","description":"Proceed with clarity at every stage of the journey."}
    ],
    "about": {
      "eyebrow": "ABOUT US",
      "heading": "Built around clarity, not confusion.",
      "p1": "Immigration processes can feel overwhelming. We provide structured, calm support to help you understand each step.",
      "p2": "Our approach is consultation-based, confidential, and focused on giving you the clarity and confidence to move forward.",
      "cta": "Learn More About Us"
    },
    "cta_band": {
      "heading": "Start your journey with clarity.",
      "subtext": "Book a consultation today and take the first structured step.",
      "button": "Book a Consultation"
    }
  }'::jsonb
);

insert into public.services (title, slug, icon, short_description, content, status, display_order) values
  ('Immigration Guidance','immigration-guidance','Compass','Understand your current situation and available immigration pathways in Ireland.','<p>We help you understand your immigration options and the pathways available in Ireland.</p>','published',1),
  ('Naturalisation Preparation','naturalisation-preparation','BadgeCheck','Organise and prepare your documentation with clarity and confidence.','<p>Get your documentation ready for naturalisation with a structured approach.</p>','published',2),
  ('Case Readiness Support','case-readiness-support','BookOpen','Prepare effectively before meeting with your legal representative.','<p>Be fully prepared for your legal meetings with organised case materials.</p>','published',3),
  ('Document Organisation','document-organisation','FolderOpen','Keep your documents clear, complete and well-structured for your application.','<p>We help structure and organise your documentation for any application.</p>','published',4);

insert into public.testimonials (client_name, location, testimonial_text, rating, status) values
  ('Aisha K.','Dublin','ClarityPath helped me understand my options clearly and prepared my documents so professionally. I felt supported throughout the entire process.',5,'published'),
  ('Michael T.','Cork','The guidance I received was honest, clear and extremely helpful. I highly recommend ClarityPath to anyone navigating immigration in Ireland.',5,'published'),
  ('Priya S.','Galway','Very organised and responsive. They made a complex process feel manageable and gave me the confidence to move forward.',5,'published');

insert into public.faqs (question, answer, category, display_order) values
  ('How long does the immigration process take?','<p>Timelines vary depending on the pathway. We help you plan realistically based on your situation.</p>','General',1),
  ('What documents will I need?','<p>Required documents depend on your application type. We provide structured checklists.</p>','General',2),
  ('Can you help with naturalisation applications?','<p>Yes, we support preparation and organisation for naturalisation applications.</p>','Services',3),
  ('What happens in a consultation?','<p>We review your situation, answer your questions, and outline a clear path forward.</p>','Consultations',4);

insert into public.consultation_types (title, description, duration_minutes, price_cents, is_active) values
  ('Free Discovery Call','A short call to understand your situation and outline next steps.',30,0,true),
  ('Full Consultation','In-depth consultation with structured guidance and document review.',60,15000,true);

insert into public.blog_categories (name, slug) values
  ('Guides','guides'),
  ('Updates','updates');
