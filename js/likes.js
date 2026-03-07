const SUPABASE_URL = 'https://rqwqatxlqfddgovclpow.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8t_kD7RYlVO-2LWz7JTxIw_S2dghbhH';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LIKED_KEY = 'liked_photos';
const countCache = {}; // photoId -> count (avoids refetching on lightbox navigation)

function getLikedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY)) || []); }
  catch { return new Set(); }
}

function saveLikedSet(set) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
}

async function getLikes(photoId) {
  if (countCache[photoId] !== undefined) return countCache[photoId];
  const { data } = await _supabase
    .from('photo_likes')
    .select('likes')
    .eq('photo_id', photoId)
    .maybeSingle();
  const count = data ? data.likes : 0;
  countCache[photoId] = count;
  return count;
}

// Uses a Supabase RPC for an atomic increment — prevents race conditions
// from simultaneous requests producing the wrong count.
// Required SQL (run once in Supabase SQL editor):
//
//   create or replace function increment_likes(p_photo_id text)
//   returns int language sql as $$
//     insert into photo_likes (photo_id, likes)
//     values (p_photo_id, 1)
//     on conflict (photo_id)
//     do update set likes = photo_likes.likes + 1
//     returning likes;
//   $$;
function getVisitorId() {
  let id = localStorage.getItem('visitor_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('visitor_id', id); }
  return id;
}

async function incrementLike(photoId) {
  const { data, error } = await _supabase.rpc('increment_likes', {
    p_photo_id: photoId,
    p_visitor_id: getVisitorId()
  });
  if (error) {
    const current = countCache[photoId] ?? 0;
    countCache[photoId] = current + 1;
    return countCache[photoId];
  }
  countCache[photoId] = data;
  return data;
}

async function decrementLike(photoId) {
  const { data, error } = await _supabase.rpc('decrement_likes', { p_photo_id: photoId });
  if (error) {
    const current = countCache[photoId] ?? 1;
    countCache[photoId] = Math.max(current - 1, 0);
    return countCache[photoId];
  }
  const count = data ?? 0;
  countCache[photoId] = count;
  return count;
}

function clearLikedIfReset(photoId, btn) {
  const liked = getLikedSet();
  if (liked.has(photoId)) {
    liked.delete(photoId);
    saveLikedSet(liked);
    btn.classList.remove('like-btn--liked');
    btn.setAttribute('aria-pressed', 'false');
  }
}

function updateLightboxLike(photoId) {
  const btn = document.getElementById('lightboxLikeBtn');
  if (!btn) return;
  btn.dataset.photoId = photoId;

  const isLiked = getLikedSet().has(photoId);
  btn.classList.toggle('like-btn--liked', isLiked);
  btn.setAttribute('aria-pressed', String(isLiked));

  if (countCache[photoId] !== undefined) {
    const count = countCache[photoId];
    btn.querySelector('.like-btn__count').textContent = count;
    // If DB was reset to 0, clear the local liked state so button is clickable again
    if (count === 0) clearLikedIfReset(photoId, btn);
  } else {
    btn.querySelector('.like-btn__count').textContent = '—';
    getLikes(photoId).then(count => {
      if (btn.dataset.photoId !== photoId) return;
      btn.querySelector('.like-btn__count').textContent = count;
      if (count === 0) clearLikedIfReset(photoId, btn);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const btn = document.getElementById('lightboxLikeBtn');
  if (!lightbox || !btn) return;

  // Watch for main.js setting data-current-photo-id on the lightbox element
  new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.attributeName === 'data-current-photo-id') {
        const photoId = lightbox.dataset.currentPhotoId;
        if (photoId) updateLightboxLike(photoId);
      }
    }
  }).observe(lightbox, { attributes: true });

  // Like / unlike toggle
  btn.addEventListener('click', async () => {
    const photoId = btn.dataset.photoId;
    if (!photoId) return;

    const liked = getLikedSet();
    btn.disabled = true;

    if (liked.has(photoId)) {
      // Unlike
      const newCount = await decrementLike(photoId);
      liked.delete(photoId);
      saveLikedSet(liked);
      btn.querySelector('.like-btn__count').textContent = newCount;
      btn.classList.remove('like-btn--liked');
      btn.setAttribute('aria-pressed', 'false');
    } else {
      // Like
      const newCount = await incrementLike(photoId);
      liked.add(photoId);
      saveLikedSet(liked);
      btn.querySelector('.like-btn__count').textContent = newCount;
      btn.classList.add('like-btn--liked');
      btn.setAttribute('aria-pressed', 'true');
    }

    btn.disabled = false;
  });
});
