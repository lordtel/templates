-- Crema — usage queries
-- Run these in Supabase SQL Editor. Nothing here mutates data.
-- All queries respect Row Level Security by running under the service role
-- (the Supabase SQL editor does). Do not expose these to the client.
--
-- Tables touched: bags, ratings, dial_in_logs, equipment

-- ───────────────────────────────────────────────────────────────
-- 1. Headline numbers
-- ───────────────────────────────────────────────────────────────

-- Total users (anyone who's written a row)
select count(distinct user_id) as total_users
from (
  select user_id from bags
  union all
  select user_id from ratings
  union all
  select user_id from dial_in_logs
  union all
  select user_id from equipment
) u;

-- Users active in last 7 / 30 days (wrote any row)
with activity as (
  select user_id, max(updated_at) as last_seen from bags group by 1
  union all
  select user_id, max(updated_at) from ratings group by 1
  union all
  select user_id, max(updated_at) from dial_in_logs group by 1
  union all
  select user_id, max(updated_at) from equipment group by 1
)
select
  count(distinct user_id) filter (where last_seen > now() - interval '7 days')  as wau,
  count(distinct user_id) filter (where last_seen > now() - interval '30 days') as mau
from activity;

-- New users per ISO week (based on earliest bag OR equipment row)
with first_row as (
  select user_id, min(created_at) as first_at from bags group by 1
  union all
  select user_id, min(updated_at) from equipment group by 1
)
select
  date_trunc('week', first_at)::date as week,
  count(distinct user_id) as new_users
from first_row
group by 1
order by 1 desc
limit 12;

-- ───────────────────────────────────────────────────────────────
-- 2. Per-user distribution
-- ───────────────────────────────────────────────────────────────

-- Bags per user (histogram buckets)
select
  case
    when n = 0 then '0'
    when n between 1 and 2 then '1-2'
    when n between 3 and 5 then '3-5'
    when n between 6 and 10 then '6-10'
    else '10+'
  end as bucket,
  count(*) as users
from (
  select user_id, count(*) as n
  from bags
  group by user_id
) t
group by 1
order by 1;

-- Ratings per user
select
  user_id,
  count(*) as ratings,
  round(avg(rating)::numeric, 2) as avg_rating
from ratings
group by user_id
order by ratings desc
limit 20;

-- Top raters in the last 30 days
select
  user_id,
  count(*) as ratings_30d
from ratings
where updated_at > now() - interval '30 days'
group by user_id
order by ratings_30d desc
limit 10;

-- ───────────────────────────────────────────────────────────────
-- 3. Feature adoption
-- ───────────────────────────────────────────────────────────────

-- Funnel: added a bag → rated at least one drink → dialed in at least one → marked finished
with per_user as (
  select
    u.user_id,
    exists (select 1 from bags b where b.user_id = u.user_id) as has_bag,
    exists (select 1 from ratings r where r.user_id = u.user_id) as has_rating,
    exists (select 1 from bags b where b.user_id = u.user_id and b.dialed_in_at is not null) as has_dial_in,
    exists (select 1 from bags b where b.user_id = u.user_id and b.finished_at is not null) as has_finished
  from (
    select distinct user_id from bags
    union select distinct user_id from ratings
    union select distinct user_id from dial_in_logs
    union select distinct user_id from equipment
  ) u
)
select
  count(*) filter (where has_bag)      as step_1_added_bag,
  count(*) filter (where has_rating)   as step_2_rated,
  count(*) filter (where has_dial_in)  as step_3_dialed_in,
  count(*) filter (where has_finished) as step_4_finished
from per_user;

-- % of users who've set their equipment
select
  (select count(*) from equipment)::float
    / nullif((select count(distinct user_id) from bags), 0)
    as equipment_adoption;

-- Share of bags that are dialed-in / finished
select
  count(*)                                          as bags_total,
  count(*) filter (where dialed_in_at is not null)  as bags_dialed_in,
  count(*) filter (where finished_at is not null)   as bags_finished,
  count(*) filter (where photo_path is not null)    as bags_with_photo;

-- ───────────────────────────────────────────────────────────────
-- 4. Content signal
-- ───────────────────────────────────────────────────────────────

-- Overall rating distribution
select rating, count(*) as n
from ratings
group by rating
order by rating;

-- Drink-type popularity (default + custom, top 10)
select
  drink_type,
  count(*) as ratings,
  round(avg(rating)::numeric, 2) as avg_rating
from ratings
group by drink_type
order by ratings desc
limit 10;

-- Dial-in usage: total attempts + median time/ratio
select
  count(*)                             as attempts,
  percentile_cont(0.5) within group (order by time_s)          as median_time_s,
  percentile_cont(0.5) within group (order by (yield / nullif(dose, 0))) as median_ratio
from dial_in_logs
where dose is not null and yield is not null;

-- Most-tried grinders
select
  coalesce(nullif(grinder_id, 'custom'), grinder_custom) as grinder,
  count(*) as users
from equipment
where grinder_id <> ''
group by 1
order by users desc
limit 15;

-- Most-tried machines
select
  coalesce(nullif(machine_id, 'custom'), machine_custom) as machine,
  count(*) as users
from equipment
where machine_id <> ''
group by 1
order by users desc
limit 15;

-- ───────────────────────────────────────────────────────────────
-- 5. Retention (rolling cohorts)
-- ───────────────────────────────────────────────────────────────

-- Signup cohort retention — what % of users from week N returned in week N+k
with cohorts as (
  select user_id, date_trunc('week', min(created_at))::date as cohort_week
  from bags
  group by user_id
),
activity as (
  select user_id, date_trunc('week', updated_at)::date as active_week
  from ratings
  union
  select user_id, date_trunc('week', updated_at)::date from bags
)
select
  c.cohort_week,
  count(distinct c.user_id) as size,
  count(distinct case when a.active_week = c.cohort_week + interval '1 week' then c.user_id end) as week_1,
  count(distinct case when a.active_week = c.cohort_week + interval '2 weeks' then c.user_id end) as week_2,
  count(distinct case when a.active_week = c.cohort_week + interval '4 weeks' then c.user_id end) as week_4
from cohorts c
left join activity a using (user_id)
group by c.cohort_week
order by c.cohort_week desc
limit 8;

-- ───────────────────────────────────────────────────────────────
-- 6. Storage / ops
-- ───────────────────────────────────────────────────────────────

-- Storage footprint (photos in the bag-photos bucket)
select
  count(*)                          as photos,
  pg_size_pretty(sum(metadata->>'size')::bigint) as total_size
from storage.objects
where bucket_id = 'bag-photos';

-- Rows per table (sanity check)
select 'bags' as tbl, count(*) from bags
union all select 'ratings',      count(*) from ratings
union all select 'dial_in_logs', count(*) from dial_in_logs
union all select 'equipment',    count(*) from equipment
order by 1;
