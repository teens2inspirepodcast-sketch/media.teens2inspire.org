-- Correct the Apple Podcasts listing URL used by the Teens2Inspire marketing and media surfaces.
UPDATE public.podcast_platforms
SET website_url = 'https://podcasts.apple.com/us/podcast/teens2inspire/id1853452190'
WHERE slug = 'apple-podcasts';
