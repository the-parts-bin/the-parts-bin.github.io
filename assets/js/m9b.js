// YouTube Shorts: <figure class="short" data-yt="VIDEO_ID">. Shows a
// poster until clicked, then loads the player (no YouTube requests before
// that). Without an id the figure stays a placeholder.
for (const fig of document.querySelectorAll('figure.short')) {
  const id = fig.dataset.yt;
  const frame = fig.querySelector('.frame');
  if (!id || !frame) {
    fig.classList.add('pending');
    continue;
  }
  // The portrait poster can be missing for a while after upload, and then
  // YouTube answers with a 120x90 grey placeholder (status 404, but still
  // an image). Show the landscape poster, and switch to the portrait one
  // only if it really is portrait.
  const poster = (name) => `url(https://i.ytimg.com/vi/${id}/${name}.jpg)`;
  frame.style.backgroundImage = poster('hqdefault');
  const portrait = new Image();
  portrait.onload = () => {
    if (portrait.naturalHeight > portrait.naturalWidth && !frame.querySelector('iframe'))
      frame.style.backgroundImage = poster('oardefault');
  };
  portrait.src = `https://i.ytimg.com/vi/${id}/oardefault.jpg`;
  const play = document.createElement('button');
  play.className = 'play';
  play.setAttribute('aria-label', 'Play the short');
  frame.append(play);
  play.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = fig.querySelector('figcaption')?.textContent ?? 'Video';
    frame.replaceChildren(iframe);
  });
}

// Diagrams with data-link: hovering an item with data-k highlights every
// item (box, wire, label, table row) that shares its key.
for (const root of document.querySelectorAll('[data-link]')) {
  const items = root.querySelectorAll('[data-k]');
  const set = (k) => {
    root.classList.toggle('linking', k !== null);
    for (const el of items) el.classList.toggle('on', k !== null && el.dataset.k.split(' ').includes(k));
  };
  for (const el of items) {
    const k = el.dataset.k.split(' ')[0];
    el.addEventListener('mouseenter', () => set(k));
    el.addEventListener('mouseleave', () => set(null));
    el.addEventListener('focus', () => set(k));
    el.addEventListener('blur', () => set(null));
  }
}
